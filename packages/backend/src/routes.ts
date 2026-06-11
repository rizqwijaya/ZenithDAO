import type { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { query, ping } from './db.js';
import { provider, token } from './chain.js';
import { config, indexerEnabled } from './config.js';

const SUPPORT_LABEL: Record<number, string> = { 0: 'against', 1: 'for', 2: 'abstain' };

function serializeProposal(p: Record<string, any>) {
  return {
    proposalId: p.proposal_id,
    proposer: p.proposer,
    description: p.description ?? '',
    startBlock: p.start_block != null ? Number(p.start_block) : null,
    endBlock: p.end_block != null ? Number(p.end_block) : null,
    status: p.status,
    forVotes: p.for_votes ?? '0',
    againstVotes: p.against_votes ?? '0',
    abstainVotes: p.abstain_votes ?? '0',
    createdAt: p.created_at,
  };
}

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // GET /health — health check
  app.get('/health', async () => {
    const dbUp = await ping();
    let chainUp = false;
    let blockNumber: number | null = null;
    if (provider) {
      try {
        blockNumber = await provider.getBlockNumber();
        chainUp = true;
      } catch {
        /* chain unreachable */
      }
    }
    return {
      status: 'ok',
      db: dbUp ? 'up' : 'down',
      chain: chainUp ? 'up' : 'down',
      blockNumber,
      indexer: indexerEnabled(),
    };
  });

  // GET /proposals — list all proposals (+ optional ?status= filter)
  app.get('/proposals', async (req) => {
    const status = (req.query as { status?: string } | undefined)?.status;
    const rows = status
      ? await query('SELECT * FROM proposals WHERE status = $1 ORDER BY created_at DESC', [status])
      : await query('SELECT * FROM proposals ORDER BY created_at DESC');
    return rows.map(serializeProposal);
  });

  // GET /proposals/:id — proposal detail
  app.get('/proposals/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const rows = await query('SELECT * FROM proposals WHERE proposal_id = $1', [id]);
    if (!rows.length) return reply.code(404).send({ error: 'Proposal not found' });
    return serializeProposal(rows[0]);
  });

  // GET /proposals/:id/votes — all votes for a proposal
  app.get('/proposals/:id/votes', async (req) => {
    const { id } = req.params as { id: string };
    const rows = await query(
      `SELECT id, proposal_id, voter, support, weight, reason, block_number, created_at
       FROM votes WHERE proposal_id = $1 ORDER BY block_number ASC, id ASC`,
      [id],
    );
    return rows.map((v) => ({
      id: v.id,
      proposalId: v.proposal_id,
      voter: v.voter,
      support: v.support,
      supportLabel: SUPPORT_LABEL[v.support] ?? 'unknown',
      weight: v.weight,
      weightFormatted: ethers.formatEther(v.weight ?? '0'),
      reason: v.reason ?? '',
      blockNumber: v.block_number != null ? Number(v.block_number) : null,
      createdAt: v.created_at,
    }));
  });

  // GET /treasury — ETH balance + transaction history
  app.get('/treasury', async () => {
    let balanceWei = '0';
    if (provider && config.addresses.vault) {
      try {
        balanceWei = (await provider.getBalance(config.addresses.vault)).toString();
      } catch {
        /* fall back to 0 */
      }
    }
    const events = await query(
      `SELECT id, event_type, sender, target, amount, tx_hash, block_number, created_at
       FROM treasury_events ORDER BY block_number DESC NULLS LAST, id DESC`,
    );
    return {
      vault: config.addresses.vault || null,
      balanceWei,
      balanceEth: ethers.formatEther(balanceWei),
      events: events.map((e) => ({
        id: e.id,
        type: e.event_type,
        sender: e.sender,
        target: e.target,
        amountWei: e.amount,
        amountEth: ethers.formatEther(e.amount ?? '0'),
        txHash: e.tx_hash,
        blockNumber: e.block_number != null ? Number(e.block_number) : null,
        createdAt: e.created_at,
      })),
    };
  });

  // GET /delegates/:address — voting power for an address
  app.get('/delegates/:address', async (req, reply) => {
    const { address } = req.params as { address: string };
    if (!ethers.isAddress(address)) return reply.code(400).send({ error: 'Invalid address' });
    if (!token) {
      return reply.code(503).send({ error: 'Chain reads unavailable (no RPC / token address)' });
    }
    try {
      const [votes, delegate, balance] = await Promise.all([
        token.getVotes(address),
        token.delegates(address),
        token.balanceOf(address),
      ]);
      return {
        address,
        votes: votes.toString(),
        votesFormatted: ethers.formatEther(votes),
        delegate,
        balance: balance.toString(),
        balanceFormatted: ethers.formatEther(balance),
      };
    } catch {
      return reply.code(502).send({ error: 'Chain read failed' });
    }
  });
}
