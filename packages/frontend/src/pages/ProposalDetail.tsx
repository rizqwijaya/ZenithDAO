import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import {
  ArrowLeft,
  User,
  Vote,
  Loader2,
  Clock,
  Layers,
  Rocket,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { governorAbi } from '../config/abis';
import { GOVERNOR_ADDRESS, etherscanAddress, etherscanTx } from '../config/contracts';
import { useProposal, useProposalVotes } from '../hooks/useBackend';
import { useProposalActions } from '../hooks/useProposalActions';
import { STATE_TO_STATUS, proposalTitle } from '../lib/status';
import { fmtTokens, shortAddress, timeAgo } from '../lib/format';
import { StatusBadge } from '../components/StatusBadge';
import { VoteTally } from '../components/VoteTally';
import { ProposalTimeline } from '../components/ProposalTimeline';
import { VoteModal } from '../components/VoteModal';
import { Loading, ErrorState, EmptyState } from '../components/States';

export function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useAccount();
  const { data: proposal, isLoading, isError } = useProposal(id);
  const { data: votes } = useProposalVotes(id);
  const [voteOpen, setVoteOpen] = useState(false);

  // Live on-chain state takes precedence over the indexed status.
  const { data: liveState } = useReadContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: 'state',
    args: id ? [BigInt(id)] : undefined,
    query: { enabled: Boolean(GOVERNOR_ADDRESS && id), refetchInterval: 12_000 },
  });
  const { data: hasVoted } = useReadContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: 'hasVoted',
    args: id && address ? [BigInt(id), address] : undefined,
    query: { enabled: Boolean(GOVERNOR_ADDRESS && id && address) },
  });

  const status =
    liveState !== undefined ? STATE_TO_STATUS[Number(liveState)] : proposal?.status ?? 'pending';

  const { data: actions } = useProposalActions(id, proposal?.startBlock ?? null);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const busy = isPending || confirming;

  function queueProposal() {
    if (!actions || !GOVERNOR_ADDRESS) return;
    writeContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'queue',
      args: [actions.targets, actions.values, actions.calldatas, actions.descriptionHash],
    });
  }

  function executeProposal() {
    if (!actions || !GOVERNOR_ADDRESS) return;
    writeContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'execute',
      args: [actions.targets, actions.values, actions.calldatas, actions.descriptionHash],
    });
  }

  if (isLoading) return <Loading label="Loading proposal…" />;
  if (isError || !proposal)
    return <ErrorState message="This proposal isn’t indexed yet, or the backend is unreachable." />;

  const title = proposalTitle(proposal.description);

  return (
    <div className="space-y-6">
      <Link to="/proposals" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft className="h-4 w-4" /> All proposals
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-xs text-zinc-500">{timeAgo(proposal.createdAt)}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <a
              href={etherscanAddress(proposal.proposer)}
              target="_blank"
              rel="noreferrer"
              className="font-mono hover:text-zenith-300"
            >
              {shortAddress(proposal.proposer)}
            </a>
          </span>
          <span className="font-mono">ID #{proposal.proposalId.slice(0, 12)}…</span>
          {proposal.startBlock != null && <span>snapshot block {proposal.startBlock}</span>}
        </div>
      </div>

      {/* timeline */}
      <div className="card p-6">
        <ProposalTimeline status={status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* main */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Description</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {proposal.description || 'No description provided.'}
            </p>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-zinc-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Votes {votes ? `(${votes.length})` : ''}
              </h2>
            </div>
            {votes && votes.length > 0 ? (
              <ul className="divide-y divide-white/5">
                {votes.map((v) => (
                  <li key={v.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${supportClass(v.support)}`}>{v.supportLabel}</span>
                        <span className="font-mono text-xs text-zinc-400">{shortAddress(v.voter)}</span>
                      </div>
                      {v.reason && <p className="mt-1.5 text-sm text-zinc-400">“{v.reason}”</p>}
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-zinc-200">
                      {fmtTokens(v.weight)} <span className="text-xs font-normal text-zinc-500">ZNTH</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-sm text-zinc-500">No votes cast yet.</p>
            )}
          </section>
        </div>

        {/* sidebar */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">Current tally</h2>
            <VoteTally
              forVotes={proposal.forVotes}
              againstVotes={proposal.againstVotes}
              abstainVotes={proposal.abstainVotes}
            />
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Actions</h2>

            {status === 'active' && (
              <button
                onClick={() => setVoteOpen(true)}
                disabled={!isConnected || Boolean(hasVoted)}
                className="btn-primary w-full"
              >
                <Vote className="h-4 w-4" />
                {hasVoted ? 'You have voted' : 'Cast vote'}
              </button>
            )}

            {status === 'succeeded' && (
              <ActionButton
                onClick={queueProposal}
                disabled={!isConnected || busy || !actions}
                busy={busy}
                icon={Layers}
                label="Queue in timelock"
                hint={!actions ? 'Recovering proposal actions…' : 'Schedules execution after the 300s delay.'}
              />
            )}

            {status === 'queued' && (
              <ActionButton
                onClick={executeProposal}
                disabled={!isConnected || busy || !actions}
                busy={busy}
                icon={Rocket}
                label="Execute proposal"
                hint={!actions ? 'Recovering proposal actions…' : 'Runs the treasury transfer on-chain.'}
              />
            )}

            {status === 'pending' && (
              <Note icon={Clock}>Voting hasn’t opened yet (1-block delay after creation).</Note>
            )}
            {status === 'executed' && <Note icon={Rocket}>Executed — funds released from the treasury.</Note>}
            {(status === 'defeated' || status === 'canceled' || status === 'expired') && (
              <Note icon={Clock}>This proposal is closed ({status}).</Note>
            )}

            {isSuccess && hash && (
              <a
                href={etherscanTx(hash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-emerald-300 hover:underline"
              >
                Transaction confirmed <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error.message.length > 140 ? `${error.message.slice(0, 137)}…` : error.message}
              </p>
            )}
            {!isConnected && <p className="text-center text-xs text-zinc-500">Connect your wallet to act.</p>}
          </section>
        </div>
      </div>

      {id && <VoteModal proposalId={id} open={voteOpen} onClose={() => setVoteOpen(false)} />}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  busy,
  icon: Icon,
  label,
  hint,
}: {
  onClick: () => void;
  disabled: boolean;
  busy: boolean;
  icon: typeof Layers;
  label: string;
  hint: string;
}) {
  return (
    <div className="space-y-2">
      <button onClick={onClick} disabled={disabled} className="btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
        {label}
      </button>
      <p className="text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function Note({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function supportClass(support: number): string {
  if (support === 1) return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (support === 0) return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300';
}
