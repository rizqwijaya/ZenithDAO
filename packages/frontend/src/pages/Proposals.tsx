import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import { ProposalCard } from '../components/ProposalCard';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { useProposals } from '../hooks/useBackend';

const FILTERS = ['all', 'active', 'pending', 'succeeded', 'queued', 'executed', 'defeated'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  active: 'Active',
  pending: 'Pending',
  succeeded: 'Succeeded',
  queued: 'Queued',
  executed: 'Executed',
  defeated: 'Defeated',
};

export function Proposals() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: proposals, isLoading, isError } = useProposals();

  const filtered = (proposals ?? []).filter((p) => (filter === 'all' ? true : p.status === filter));
  const countFor = (f: Filter) =>
    f === 'all' ? proposals?.length ?? 0 : (proposals ?? []).filter((p) => p.status === f).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Proposals</h1>
          <p className="mt-1 text-sm text-zinc-400">Every governance proposal and its live status.</p>
        </div>
        <Link to="/create" className="btn-primary self-start">
          <PlusCircle className="h-4 w-4" /> New proposal
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'border-zenith-500/40 bg-zenith-500/15 text-zenith-100'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            {FILTER_LABEL[f]}
            <span className="ml-1.5 text-xs text-zinc-500">{countFor(f)}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState />
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((p) => (
            <ProposalCard key={p.proposalId} proposal={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={filter === 'all' ? 'No proposals yet' : `No ${FILTER_LABEL[filter].toLowerCase()} proposals`}
          hint={filter === 'all' ? 'Be the first to create one.' : 'Try a different filter.'}
        />
      )}
    </div>
  );
}
