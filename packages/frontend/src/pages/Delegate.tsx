import { Zap } from 'lucide-react';
import { DelegatePanel } from '../components/DelegatePanel';

export function Delegate() {
  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Soft accent glow behind the hero (same treatment as the faucet page). */}
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
        <div className="animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-zenith-500/30 to-cyan-500/20 shadow-glow">
            <Zap className="h-7 w-7 text-zenith-200" />
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight">Delegate voting power</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            ERC20Votes tokens are inert until delegated. Activate yours to participate in governance.
          </p>
        </div>

        <DelegatePanel />
      </div>
    </div>
  );
}
