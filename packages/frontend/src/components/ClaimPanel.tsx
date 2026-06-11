import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Droplets, Loader2, CheckCircle2, ExternalLink, Lock, Clock, ArrowRight } from 'lucide-react';
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

  // Refresh the cooldown once a claim confirms.
  useEffect(() => {
    if (isSuccess) void refetchSecs();
  }, [isSuccess, refetchSecs]);

  const busy = isPending || confirming;
  const onCooldown = remaining > 0;
  const empty =
    amount !== undefined && faucetBalance !== undefined && (faucetBalance as bigint) < (amount as bigint);
  const amountLabel = amount !== undefined ? fmtTokens(amount as bigint) : '-';

  function submitClaim() {
    if (!FAUCET_ADDRESS) return;
    reset();
    writeContract({ address: FAUCET_ADDRESS, abi: faucetAbi, functionName: 'claim' });
  }

  const statusLabel = !isConnected
    ? '-'
    : onCooldown
      ? 'On cooldown'
      : empty
        ? 'Faucet empty'
        : 'Ready';

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat label="Amount per claim" value={`${amountLabel} ZNTH`} highlight />
          <Stat label="Your status" value={statusLabel} />
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Open to every wallet. After each claim you must wait for the cooldown before claiming again.
        </p>
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <h3 className="text-base font-semibold text-white">Get test ZNTH</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Claim {amountLabel} ZNTH to your wallet, then delegate it to start voting.
          </p>
        </div>

        {!live ? (
          <Banner icon={Lock}>
            The faucet isn’t live yet. Once it’s deployed and configured, any wallet can claim here.
          </Banner>
        ) : !isConnected ? (
          <Banner icon={Droplets}>Connect your wallet to claim test tokens.</Banner>
        ) : empty ? (
          <Banner icon={Lock}>The faucet is out of tokens right now. Check back after it’s refilled.</Banner>
        ) : onCooldown ? (
          <button disabled className="btn-primary w-full">
            <Clock className="h-4 w-4" />
            Available in {formatCountdown(remaining)}
          </button>
        ) : (
          <button onClick={submitClaim} disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Droplets className="h-4 w-4" />}
            Claim {amountLabel} ZNTH
          </button>
        )}

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error.message.length > 160 ? `${error.message.slice(0, 157)}…` : error.message}
          </p>
        )}

        {isSuccess && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Claimed {amountLabel} ZNTH
              </span>
              {hash && (
                <a
                  href={etherscanTx(hash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  tx <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <Link
              to="/delegate"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-zenith-300 hover:text-zenith-200"
            >
              Delegate to activate voting power <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="stat-label">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${highlight ? 'text-zenith-200' : 'text-white'}`}>
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
