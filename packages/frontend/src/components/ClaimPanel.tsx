import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import {
  Droplets,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Lock,
  Clock,
  ArrowRight,
  Coins,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { faucetAbi, tokenAbi } from '../config/abis';
import { FAUCET_ADDRESS, TOKEN_ADDRESS, etherscanTx } from '../config/contracts';
import { fmtTokens } from '../lib/format';

/** Seconds -> "1h 05m 30s" (drops leading zero units). */
function formatCountdown(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
}

export function ClaimPanel() {
  const { address, isConnected } = useAccount();
  const live = Boolean(FAUCET_ADDRESS);
  const enabled = Boolean(FAUCET_ADDRESS && address);

  const { data: amount } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'amountPerClaim',
    query: { enabled: live },
  });
  const { data: cooldownRaw } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'cooldown',
    query: { enabled: live },
  });
  const { data: secsRaw, refetch: refetchSecs } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: faucetAbi,
    functionName: 'secondsUntilNextClaim',
    args: address ? [address] : undefined,
    query: { enabled },
  });
  const { data: faucetBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: FAUCET_ADDRESS ? [FAUCET_ADDRESS] : undefined,
    query: { enabled: Boolean(FAUCET_ADDRESS && TOKEN_ADDRESS) },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  // Local countdown so the timer ticks without re-polling the chain every second.
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (secsRaw !== undefined) setRemaining(Number(secsRaw));
  }, [secsRaw]);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining > 0]);

  useEffect(() => {
    if (isSuccess) void refetchSecs();
  }, [isSuccess, refetchSecs]);

  const busy = isPending || confirming;
  const onCooldown = remaining > 0;
  const empty =
    amount !== undefined && faucetBalance !== undefined && (faucetBalance as bigint) < (amount as bigint);
  const amountLabel = amount !== undefined ? fmtTokens(amount as bigint) : '-';
  const cooldownTotal = cooldownRaw !== undefined ? Number(cooldownRaw) : 0;

  const statusLabel = !isConnected
    ? 'Connect'
    : onCooldown
      ? 'On cooldown'
      : empty
        ? 'Faucet empty'
        : 'Ready';

  function submitClaim() {
    if (!FAUCET_ADDRESS) return;
    reset();
    writeContract({ address: FAUCET_ADDRESS, abi: faucetAbi, functionName: 'claim' });
  }

  return (
    <div className="space-y-5">
      <div className="grid animate-fade-up gap-4 sm:grid-cols-2" style={{ animationDelay: '60ms' }}>
        <StatCard
          icon={Coins}
          label="Amount per claim"
          value={`${amountLabel} ZNTH`}
          accent="from-zenith-500/20 to-cyan-500/10"
          highlight
        />
        <StatCard icon={Activity} label="Your status" value={statusLabel} accent="from-white/10 to-white/5" />
      </div>

      <div
        className="card relative animate-fade-up overflow-hidden p-6"
        style={{ animationDelay: '120ms' }}
      >
        {/* soft accent wash in the corner */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-zenith-500/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Get test ZNTH</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-400">
              Claim {amountLabel} ZNTH to your wallet, then delegate it to start voting.
            </p>
          </div>

          {/* The centerpiece adapts to state: emblem + claim, or a live countdown ring. */}
          {!live ? (
            <Banner icon={Lock}>
              The faucet isn’t live yet. Once it’s deployed and configured, any wallet can claim here.
            </Banner>
          ) : empty ? (
            <>
              <Emblem active={false} />
              <Banner icon={Lock}>
                The faucet is out of tokens right now. Check back after it’s refilled.
              </Banner>
            </>
          ) : onCooldown ? (
            <div className="flex flex-col items-center gap-3">
              <CooldownRing remaining={remaining} total={cooldownTotal} />
              <p className="text-xs text-zinc-500">Come back when the ring empties to claim again.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <Emblem active={isConnected} />
              {!isConnected ? (
                <Banner icon={Droplets}>Connect your wallet to claim test tokens.</Banner>
              ) : (
                <button onClick={submitClaim} disabled={busy} className="btn-primary w-full max-w-xs">
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Droplets className="h-4 w-4" />
                  )}
                  {busy ? 'Claiming…' : `Claim ${amountLabel} ZNTH`}
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error.message.length > 160 ? `${error.message.slice(0, 157)}…` : error.message}
            </p>
          )}

          {isSuccess && (
            <div className="animate-pop-in relative overflow-hidden rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-5 text-center">
              {/* twinkling sparkle accents */}
              <Sparkles className="animate-twinkle absolute left-5 top-4 h-3.5 w-3.5 text-emerald-300/70" />
              <Sparkles
                className="animate-twinkle absolute right-6 top-6 h-3 w-3 text-cyan-300/70"
                style={{ animationDelay: '0.6s' }}
              />
              <Sparkles
                className="animate-twinkle absolute bottom-8 left-10 h-2.5 w-2.5 text-emerald-200/60"
                style={{ animationDelay: '1.1s' }}
              />

              <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center">
                <span className="animate-pulse-glow absolute inset-0 rounded-full bg-emerald-400/30 blur-md" />
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/50">
                  <CheckCircle2 className="animate-check-pop h-7 w-7 text-emerald-300" />
                </span>
              </div>

              <p className="bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-lg font-bold text-transparent">
                {amountLabel} ZNTH claimed!
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
                Tokens are in your wallet. Delegate them to unlock your voting power.
              </p>

              <div className="mt-4 flex flex-col items-center gap-2">
                <Link to="/delegate" className="btn-primary w-full max-w-xs">
                  Delegate to vote
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {hash && (
                  <a
                    href={etherscanTx(hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200/80 hover:text-emerald-200"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Bobbing droplet emblem with a soft glow; brighter when claiming is available. */
function Emblem({ active }: { active: boolean }) {
  return (
    <div className="relative mx-auto h-24 w-24">
      <div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-zenith-500/40 to-cyan-500/30 blur-xl ${
          active ? 'animate-pulse-glow' : 'opacity-40'
        }`}
      />
      <div className="animate-floaty relative flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-ink-700 to-ink-800 shadow-lg">
        <Droplets className={`h-10 w-10 ${active ? 'text-zenith-300' : 'text-zinc-600'}`} />
        {active && (
          <span className="animate-drip absolute left-1/2 top-[58%] h-2.5 w-1.5 rounded-full bg-cyan-300/90" />
        )}
      </div>
    </div>
  );
}

/** Circular progress ring that depletes as the cooldown counts down. */
function CooldownRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, remaining / total) : 0;
  const offset = circ * (1 - frac);

  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b82f6" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Clock className="mb-1 h-4 w-4 text-zenith-300" />
        <span className="font-mono text-lg font-semibold text-white">{formatCountdown(remaining)}</span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">until next claim</span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-zenith-500/40 hover:bg-white/[0.07]">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${accent}`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="stat-label">{label}</div>
      </div>
      <div className={`mt-2 text-lg font-semibold ${highlight ? 'text-zenith-200' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

function Banner({ icon: Icon, children }: { icon: typeof Droplets; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-zinc-400">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
