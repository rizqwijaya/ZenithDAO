import { Link } from 'react-router-dom';
import { ArrowUpRight, User } from 'lucide-react';
import type { ApiProposal } from '../config/api';
import { StatusBadge } from './StatusBadge';
import { VoteTally } from './VoteTally';
import { proposalTitle } from '../lib/status';
import { shortAddress, timeAgo } from '../lib/format';

export function ProposalCard({ proposal }: { proposal: ApiProposal }) {
  const title = proposalTitle(proposal.description);

  return (
    <Link
      to={`/proposals/${proposal.proposalId}`}
      className="card group block p-5 transition hover:border-zenith-500/40 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={proposal.status} />
            <span className="text-xs text-zinc-500">{timeAgo(proposal.createdAt)}</span>
          </div>
          <h3 className="truncate text-base font-semibold text-white group-hover:text-zenith-200">
            {title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
            <User className="h-3.5 w-3.5" />
            <span className="font-mono">{shortAddress(proposal.proposer)}</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono">#{proposal.proposalId.slice(0, 8)}…</span>
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-zinc-600 transition group-hover:text-zenith-300" />
      </div>

      <div className="mt-4">
        <VoteTally
          forVotes={proposal.forVotes}
          againstVotes={proposal.againstVotes}
          abstainVotes={proposal.abstainVotes}
          compact
        />
      </div>
    </Link>
  );
}
