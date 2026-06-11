import { Droplets } from 'lucide-react';
import { ClaimPanel } from '../components/ClaimPanel';
import { AddTokenCard } from '../components/AddTokenCard';

export function Claim() {
  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Drifting accent glow behind the hero. Full-viewport width so the clip
          edges sit off-screen and a radial fade keeps the bottom soft — no hard
          rectangle, no horizontal scroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[440px] w-screen -translate-x-1/2 overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(50% 60% at 50% 0%, rgba(59,130,246,0.16), transparent 72%)',
          }}
        />
        <div className="animate-blob absolute left-[18%] top-4 h-64 w-64 rounded-full bg-zenith-500/25 blur-[80px]" />
        <div
          className="animate-blob absolute right-[18%] top-24 h-56 w-56 rounded-full bg-cyan-500/20 blur-[80px]"
          style={{ animationDelay: '5s' }}
        />
      </div>

      <div className="space-y-6">
        <div className="animate-fade-up text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-zenith-500/30 to-cyan-500/20 shadow-glow">
            <Droplets className="h-7 w-7 text-zenith-200" />
          </div>
          <h1 className="text-gradient text-3xl font-bold tracking-tight">ZNTH faucet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
            Grab test ZNTH to try governance. Open to any wallet, with a short cooldown between claims.
          </p>
        </div>

        <ClaimPanel />

        <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <AddTokenCard />
        </div>
      </div>
    </div>
  );
}
