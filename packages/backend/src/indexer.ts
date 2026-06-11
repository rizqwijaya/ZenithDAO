import type { FastifyBaseLogger } from 'fastify';
import { ethers } from 'ethers';
import { config, indexerEnabled } from './config.js';
import { provider, governor, vault, STATUS_BY_STATE, TERMINAL_STATUSES } from './chain.js';
import { pool, query, getCursor, setCursor } from './db.js';

type Logger = FastifyBaseLogger;
type Ev = ethers.EventLog | ethers.Log;

const argsOf = (ev: Ev): Record<string, any> => (ev as ethers.EventLog).args as any;

/**
 * Backfills from the last cursor to chain head, then polls for new blocks.
 * Idempotent: every insert is guarded by ON CONFLICT, so re-scanning a block
 * range never duplicates rows.
 */
export async function startIndexer(log: Logger): Promise<void> {
  if (!indexerEnabled() || !provider || !governor || !vault) {
    log.warn('Indexer disabled — set SEPOLIA_RPC_URL + governor/vault addresses to enable.');
    return;
  }
  // Narrow the module-level nullables into non-null locals for the closure below.
  const p = provider;
  const g = governor;
  const v = vault;

  let cursor: number;
  const existing = await getCursor();
  if (existing === null) {
    const head = await p.getBlockNumber();
    const start = config.startBlock ?? head;
    cursor = Math.max(start - 1, 0);
    await setCursor(cursor);
    log.info(`Indexer cursor initialised at block ${cursor} (start=${start}, head=${head}).`);
  } else {
    cursor = existing;
  }

  const tick = async () => {
    try {
      const head = await p.getBlockNumber();
      while (cursor < head) {
        const from = cursor + 1;
        const to = Math.min(from + config.logChunkSize - 1, head);
        await indexRange(g, v, from, to, log);
        cursor = to;
        await setCursor(cursor);
      }
      await refreshStatuses(log);
    } catch (err) {
      log.error({ err }, 'Indexer tick failed');
    }
  };

  await tick();
  setInterval(tick, config.pollIntervalMs);
  log.info(`Indexer running — polling every ${config.pollIntervalMs}ms from block ${cursor}.`);
}

async function indexRange(
  g: ethers.Contract,
  v: ethers.Contract,
  from: number,
  to: number,
  log: Logger,
): Promise<void> {
  const [created, votesA, votesB, queued, executed, canceled, received, executedEth] =
    await Promise.all([
      g.queryFilter(g.filters.ProposalCreated(), from, to),
      g.queryFilter(g.filters.VoteCast(), from, to),
      g.queryFilter(g.filters.VoteCastWithParams(), from, to),
      g.queryFilter(g.filters.ProposalQueued(), from, to),
      g.queryFilter(g.filters.ProposalExecuted(), from, to),
      g.queryFilter(g.filters.ProposalCanceled(), from, to),
      v.queryFilter(v.filters.ETHReceived(), from, to),
      v.queryFilter(v.filters.ETHExecuted(), from, to),
    ]);

  for (const ev of created) await onProposalCreated(ev);
  const allVotes = [...votesA, ...votesB];
  for (const ev of allVotes) await onVoteCast(ev);
  for (const ev of queued) await onStatus(ev, 'queued');
  for (const ev of executed) await onStatus(ev, 'executed');
  for (const ev of canceled) await onStatus(ev, 'canceled');
  for (const ev of received) await onEthReceived(ev);
  for (const ev of executedEth) await onEthExecuted(ev);

  // Recompute tallies for any proposal that received a vote in this range.
  const touched = new Set<string>();
  for (const ev of allVotes) touched.add(argsOf(ev).proposalId.toString());
  for (const id of touched) await recomputeTally(id);

  const total =
    created.length +
    allVotes.length +
    queued.length +
    executed.length +
    canceled.length +
    received.length +
    executedEth.length;
  if (total > 0) log.info(`Indexed blocks ${from}-${to}: ${total} event(s).`);
}

async function onProposalCreated(ev: Ev): Promise<void> {
  const a = argsOf(ev);
  await pool.query(
    `INSERT INTO proposals (proposal_id, proposer, description, start_block, end_block, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     ON CONFLICT (proposal_id) DO UPDATE
       SET proposer = EXCLUDED.proposer,
           description = EXCLUDED.description,
           start_block = EXCLUDED.start_block,
           end_block = EXCLUDED.end_block`,
    [a.proposalId.toString(), a.proposer, a.description, a.voteStart.toString(), a.voteEnd.toString()],
  );
}

async function onVoteCast(ev: Ev): Promise<void> {
  const a = argsOf(ev);
  await pool.query(
    `INSERT INTO votes (proposal_id, voter, support, weight, reason, block_number)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (proposal_id, voter) DO NOTHING`,
    [a.proposalId.toString(), a.voter, Number(a.support), a.weight.toString(), a.reason ?? '', ev.blockNumber],
  );
}

async function recomputeTally(proposalId: string): Promise<void> {
  await pool.query(
    `UPDATE proposals p SET
       for_votes     = COALESCE((SELECT SUM(weight::numeric) FROM votes WHERE proposal_id = p.proposal_id AND support = 1), 0)::text,
       against_votes = COALESCE((SELECT SUM(weight::numeric) FROM votes WHERE proposal_id = p.proposal_id AND support = 0), 0)::text,
       abstain_votes = COALESCE((SELECT SUM(weight::numeric) FROM votes WHERE proposal_id = p.proposal_id AND support = 2), 0)::text
     WHERE p.proposal_id = $1`,
    [proposalId],
  );
}

async function onStatus(ev: Ev, status: string): Promise<void> {
  const a = argsOf(ev);
  await pool.query('UPDATE proposals SET status = $2 WHERE proposal_id = $1', [
    a.proposalId.toString(),
    status,
  ]);
}

async function onEthReceived(ev: Ev): Promise<void> {
  const a = argsOf(ev);
  await pool.query(
    `INSERT INTO treasury_events (event_type, sender, target, amount, tx_hash, block_number)
     VALUES ('received', $1, NULL, $2, $3, $4)
     ON CONFLICT (tx_hash, event_type) DO NOTHING`,
    [a.sender, a.amount.toString(), ev.transactionHash, ev.blockNumber],
  );
}

async function onEthExecuted(ev: Ev): Promise<void> {
  const a = argsOf(ev);
  await pool.query(
    `INSERT INTO treasury_events (event_type, sender, target, amount, tx_hash, block_number)
     VALUES ('executed', NULL, $1, $2, $3, $4)
     ON CONFLICT (tx_hash, event_type) DO NOTHING`,
    [a.target, a.amount.toString(), ev.transactionHash, ev.blockNumber],
  );
}

/** Re-query Governor.state() for non-terminal proposals so Active/Succeeded/Defeated stay fresh. */
async function refreshStatuses(log: Logger): Promise<void> {
  if (!governor) return;
  const rows = await query<{ proposal_id: string; status: string }>(
    'SELECT proposal_id, status FROM proposals',
  );
  for (const row of rows) {
    if (TERMINAL_STATUSES.has(row.status)) continue;
    try {
      const state = Number(await governor.state(row.proposal_id));
      const next = STATUS_BY_STATE[state];
      if (next && next !== row.status) {
        await pool.query('UPDATE proposals SET status = $2 WHERE proposal_id = $1', [
          row.proposal_id,
          next,
        ]);
      }
    } catch (err) {
      log.warn({ err, proposalId: row.proposal_id }, 'Governor.state() refresh failed');
    }
  }
}
