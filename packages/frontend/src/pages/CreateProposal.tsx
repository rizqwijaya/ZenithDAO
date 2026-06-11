import { Link } from 'react-router-dom';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { CreateProposalForm } from '../components/CreateProposalForm';

export function CreateProposal() {
  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Soft accent glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-140px] -z-10 h-[560px] w-[130%] -translate-x-1/2"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(45% 50% at 50% 42%, rgba(59,130,246,0.14), transparent 70%)',
          }}
        />
        <div className="animate-blob absolute left-1/4 top-32 h-56 w-56 -translate-x-1/2 rounded-full bg-zenith-500/20 blur-[80px]" />
        <div
          className="animate-blob absolute right-1/4 top-48 h-52 w-52 translate-x-1/2 rounded-full bg-cyan-500/15 blur-[80px]"
          style={{ animationDelay: '5s' }}
        />
      </div>

      <div className="space-y-6">
        <Link
          to="/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" /> All proposals
        </Link>

        <div className="animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-zenith-500/30 to-cyan-500/20 shadow-glow">
            <Megaphone className="h-7 w-7 text-zenith-200" />
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight">Create proposal</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Propose a treasury action. It needs at least the proposal threshold in delegated ZNTH.
          </p>
        </div>

        <CreateProposalForm />
      </div>
    </div>
  );
}
