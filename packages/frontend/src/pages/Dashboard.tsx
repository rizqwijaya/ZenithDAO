import { Link } from 'react-router-dom';
import { FileText, Activity, CheckCircle2, PlusCircle, ArrowRight } from 'lucide-react';
import { TreasuryBalance } from '../components/TreasuryBalance';
import { ProposalCard } from '../components/ProposalCard';
import { Loading, ErrorState, EmptyState } from '../components/States';
import { useProposals } from '../hooks/useBackend';

export function Dashboard() {
  const { data: proposals, isLoading, isError } = useProposals();

  const total = proposals?.length ?? 0;
  const active = proposals?.filter((p) => p.status === 'active') ?? [];
  const executed = proposals?.filter((p) => p.status === 'executed').length ?? 0;
  const recent = proposals?.slice(0, 4) ?? [];

  return (
    <div className="space-y-8">
      {/* hero */}
      <section className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-zenith-grad opacity-20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="badge border-zenith-500/30 bg-zenith-500/10 text-zenith-200">
            Ethereum Sepolia
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Govern the treasury, <span className="text-zenith-300">without limits.</span>
          </h1>
          <p className="mt-3 text-zinc-400">
            ZenithDAO lets $ZNTH holders propose, vote, and execute treasury decisions trustlessly -
            enforced entirely by smart contracts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/create" className="btn-primary">
              <PlusCircle className="h-4 w-4" /> Create proposal
            </Link>
            <Link to="/proposals" className="btn-ghost">
              Browse proposals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TreasuryBalance />
        <StatCard icon={FileText} label="Total proposals" value={total} />
        <StatCard icon={Activity} label="Active now" value={active.length} accent />
        <StatCard icon={CheckCircle2} label="Executed" value={executed} />
      </section>

      {/* active proposals */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Active proposals</h2>
          <Link to="/proposals" className="text-sm text-zenith-300 hover:underline">
            View all
          </Link>
        </div>

        {isLoading ? (
          <Loading />
        ) : isError ? (
          <ErrorState />
        ) : active.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {active.map((p) => (
              <ProposalCard key={p.proposalId} proposal={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No active proposals"
            hint="When a proposal enters its voting window it will show up here."
          />
        )}
      </section>

      {/* recent */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Recent activity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recent.map((p) => (
              <ProposalCard key={p.proposalId} proposal={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 text-zinc-400">
        <Icon className="h-4 w-4" />
        <span className="stat-label">{label}</span>
      </div>
      <div className={`mt-3 text-4xl font-bold tracking-tight ${accent ? 'text-zenith-300' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
