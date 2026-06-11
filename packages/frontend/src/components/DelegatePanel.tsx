import { useEffect, useState } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { isAddress, zeroAddress, type Address } from 'viem';
import { Loader2, UserCheck, Zap, ExternalLink, CheckCircle2, Sparkles } from 'lucide-react';
import { tokenAbi } from '../config/abis';
import { TOKEN_ADDRESS, etherscanTx } from '../config/contracts';
import { fmtTokens, shortAddress } from '../lib/format';

export function DelegatePanel() {
  const { address, isConnected } = useAccount();
  const [custom, setCustom] = useState('');

  const enabled = Boolean(TOKEN_ADDRESS && address);

  const { data: votes, refetch: refetchVotes } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled },
  });
  const { data: delegate, refetch: refetchDelegate } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: { enabled },
  });
  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: Boolean(hash),
    },
  });

  // Refresh reads once a delegation tx confirms.
  useEffect(() => {
    if (isSuccess) {
      void refetchVotes();
      void refetchDelegate();
    }
  }, [isSuccess, refetchVotes, refetchDelegate]);

  const delegatedTo = (delegate as Address | undefined) ?? zeroAddress;
  const isSelfDelegated = address && delegatedTo.toLowerCase() === address.toLowerCase();
  const notDelegated = delegatedTo === zeroAddress;
  const busy = isPending || confirming;

  function delegateTo(target: Address) {
    if (!TOKEN_ADDRESS) return;
    reset();
    writeContract({ address: TOKEN_ADDRESS, abi: tokenAbi, functionName: 'delegate', args: [target] });
  }

  return (
    <div className="space-y-5">
      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Token balance" value={`${balance !== undefined ? fmtTokens(balance as bigint) : '-'} ZNTH`} />
          <Stat label="Voting power" value={`${votes !== undefined ? fmtTokens(votes as bigint) : '-'} ZNTH`} highlight />
          <Stat
            label="Delegated to"
            value={notDelegated ? 'Nobody' : isSelfDelegated ? 'Self' : shortAddress(delegatedTo)}
          />
        </div>

        {isConnected && notDelegated && (
          <p className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            Your tokens have no voting power yet. Delegate to yourself to activate it.
          </p>
        )}
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <h3 className="text-base font-semibold text-white">Activate voting power</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Delegation assigns your token weight to a voter. You keep custody of your tokens.
          </p>
        </div>

        <button
          onClick={() => address && delegateTo(address)}
          disabled={!isConnected || busy || Boolean(isSelfDelegated)}
          className="btn-primary w-full"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isSelfDelegated ? 'Already self-delegated' : 'Delegate to myself'}
        </button>

        <div className="flex items-center gap-3 text-xs text-zinc-600">
          <div className="h-px flex-1 bg-white/10" />
          or delegate to another address
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="0x…"
            className="input font-mono"
          />
          <button
            onClick={() => delegateTo(custom as Address)}
            disabled={!isConnected || busy || !isAddress(custom)}
            className="btn-ghost shrink-0"
          >
            <UserCheck className="h-4 w-4" />
            Delegate
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {error.message.length > 160 ? `${error.message.slice(0, 157)}…` : error.message}
          </p>
        )}

        {isSuccess && (
          <div className="animate-pop-in relative overflow-hidden rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 p-5 text-center">
            {/* twinkling sparkle accents */}
            <Sparkles className="absolute left-5 top-4 h-3.5 w-3.5 text-emerald-300/70 animate-twinkle" />
            <Sparkles
              className="absolute right-6 top-6 h-3 w-3 text-cyan-300/70 animate-twinkle"
              style={{ animationDelay: '0.6s' }}
            />
            <Sparkles
              className="absolute bottom-4 left-10 h-2.5 w-2.5 text-emerald-200/60 animate-twinkle"
              style={{ animationDelay: '1.1s' }}
            />

            <div className="relative mx-auto mb-3 flex h-14 w-14 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-400/30 blur-md animate-pulse-glow" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/50">
                <CheckCircle2 className="h-7 w-7 text-emerald-300 animate-check-pop" />
              </span>
            </div>

            <p className="bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-sm font-bold text-transparent">
              Voting power activated
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-zinc-400">
              Your ZNTH now counts in every vote. You’re ready to govern.
            </p>

            {hash && (
              <a
                href={etherscanTx(hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-white/10"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {!isConnected && (
          <p className="text-center text-xs text-zinc-500">Connect your wallet to delegate.</p>
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
