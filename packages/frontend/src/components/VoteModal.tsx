import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { X, ThumbsUp, ThumbsDown, MinusCircle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { governorAbi } from '../config/abis';
import { GOVERNOR_ADDRESS, etherscanTx } from '../config/contracts';

interface VoteModalProps {
  proposalId: string;
  open: boolean;
  onClose: () => void;
}

const OPTIONS = [
  { support: 1, label: 'For', icon: ThumbsUp, active: 'border-emerald-500 bg-emerald-500/15 text-emerald-200' },
  { support: 0, label: 'Against', icon: ThumbsDown, active: 'border-rose-500 bg-rose-500/15 text-rose-200' },
  { support: 2, label: 'Abstain', icon: MinusCircle, active: 'border-zinc-400 bg-zinc-500/15 text-zinc-200' },
];

export function VoteModal({ proposalId, open, onClose }: VoteModalProps) {
  const [support, setSupport] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  if (!open) return null;

  const busy = isPending || confirming;

  function close() {
    reset();
    setSupport(null);
    setReason('');
    onClose();
  }

  function submit() {
    if (support === null || !GOVERNOR_ADDRESS) return;
    writeContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'castVoteWithReason',
      args: [BigInt(proposalId), support, reason],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={busy ? undefined : close} />
      <div className="card relative w-full max-w-md p-6">
        <button
          onClick={close}
          className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-200"
          disabled={busy}
        >
          <X className="h-5 w-5" />
        </button>

        {isSuccess ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            <h3 className="mt-3 text-lg font-semibold text-white">Vote submitted</h3>
            <p className="mt-1 text-sm text-zinc-400">Your vote is on-chain and will be tallied shortly.</p>
            {hash && (
              <a
                href={etherscanTx(hash)}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-zenith-300 hover:underline"
              >
                View transaction <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <button onClick={close} className="btn-primary mt-5 w-full">
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white">Cast your vote</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Voting weight is your delegated power at the proposal snapshot.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = support === opt.support;
                return (
                  <button
                    key={opt.support}
                    onClick={() => setSupport(opt.support)}
                    disabled={busy}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 text-sm font-semibold transition ${
                      selected ? opt.active : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block">
              <span className="stat-label">Reason (optional)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you voting this way?"
                rows={3}
                disabled={busy}
                className="input mt-1.5 resize-none"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {shortError(error.message)}
              </p>
            )}

            <button
              onClick={submit}
              disabled={support === null || busy || !GOVERNOR_ADDRESS}
              className="btn-primary mt-5 w-full"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? 'Confirm in wallet…' : confirming ? 'Submitting…' : 'Submit vote'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function shortError(msg: string): string {
  return msg.length > 160 ? `${msg.slice(0, 157)}…` : msg;
}
