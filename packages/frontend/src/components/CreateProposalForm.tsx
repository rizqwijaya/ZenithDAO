import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { encodeFunctionData, formatEther, isAddress, parseEther, type Address, type Hex } from 'viem';
import { Loader2, CheckCircle2, ExternalLink, Send } from 'lucide-react';
import { governorAbi, tokenAbi, vaultAbi } from '../config/abis';
import { GOVERNOR_ADDRESS, TOKEN_ADDRESS, VAULT_ADDRESS, etherscanTx } from '../config/contracts';
import { fmtTokens } from '../lib/format';

export function CreateProposalForm() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: threshold } = useReadContract({
    address: GOVERNOR_ADDRESS,
    abi: governorAbi,
    functionName: 'proposalThreshold',
    query: { enabled: Boolean(GOVERNOR_ADDRESS) },
  });

  const { data: votes } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: 'getVotes',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(TOKEN_ADDRESS && address) },
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const belowThreshold =
    threshold !== undefined && votes !== undefined && (votes as bigint) < (threshold as bigint);

  const recipientValid = isAddress(recipient);
  const amountValid = useMemo(() => {
    if (!amount.trim()) return false;
    try {
      return parseEther(amount) > 0n;
    } catch {
      return false;
    }
  }, [amount]);

  const calldata: Hex | null = useMemo(() => {
    if (!recipientValid || !amountValid) return null;
    try {
      return encodeFunctionData({
        abi: vaultAbi,
        functionName: 'executeETH',
        args: [recipient as Address, parseEther(amount)],
      });
    } catch {
      return null;
    }
  }, [recipient, amount, recipientValid, amountValid]);

  const canSubmit =
    isConnected && GOVERNOR_ADDRESS && VAULT_ADDRESS && calldata && description.trim().length > 0 && !belowThreshold;

  function submit() {
    if (!canSubmit || !calldata || !GOVERNOR_ADDRESS || !VAULT_ADDRESS) return;
    writeContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'propose',
      args: [[VAULT_ADDRESS], [0n], [calldata], description],
    });
  }

  const busy = isPending || confirming;

  if (isSuccess) {
    return (
      <div className="card flex flex-col items-center p-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-400" />
        <h3 className="mt-4 text-xl font-semibold text-white">Proposal created</h3>
        <p className="mt-1 max-w-sm text-sm text-zinc-400">
          It enters a 1-block voting delay, then voting opens for 50 blocks.
        </p>
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
        <button onClick={() => navigate('/proposals')} className="btn-primary mt-6">
          Go to proposals
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-5 p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">New treasury proposal</h2>
        <p className="mt-1 text-sm text-zinc-400">
          If passed, the timelock instructs the treasury vault to send ETH to the recipient.
        </p>
      </div>

      {/* voting power vs threshold */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
        <span className="text-zinc-400">Your voting power</span>
        <span className="font-semibold text-white">
          {votes !== undefined ? fmtTokens(votes as bigint) : '—'} ZNTH
          <span className="ml-2 text-xs font-normal text-zinc-500">
            / {threshold !== undefined ? fmtTokens(threshold as bigint) : '—'} required
          </span>
        </span>
      </div>

      {belowThreshold && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          You hold fewer than the proposal threshold. Acquire / delegate more ZNTH to propose.
        </p>
      )}

      <label className="block">
        <span className="stat-label">Recipient address</span>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
          className="input mt-1.5 font-mono"
        />
        {recipient && !recipientValid && (
          <span className="mt-1 block text-xs text-rose-400">Invalid address</span>
        )}
      </label>

      <label className="block">
        <span className="stat-label">Amount (ETH)</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.1"
          inputMode="decimal"
          className="input mt-1.5"
        />
        {amount && !amountValid && (
          <span className="mt-1 block text-xs text-rose-400">Enter a positive amount</span>
        )}
      </label>

      <label className="block">
        <span className="stat-label">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="ZIP-1: Fund the community grants program…"
          rows={4}
          className="input mt-1.5 resize-none"
        />
      </label>

      {calldata && (
        <div className="rounded-xl border border-white/10 bg-ink-900/60 p-3">
          <span className="stat-label">Encoded action</span>
          <div className="mt-1 space-y-1 text-xs text-zinc-400">
            <div>
              target <span className="font-mono text-zenith-300">ZenithVault.executeETH</span>
            </div>
            <div>
              sends <span className="text-white">{amount} ETH</span> →{' '}
              <span className="font-mono text-zinc-300">{recipient}</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error.message.length > 200 ? `${error.message.slice(0, 197)}…` : error.message}
        </p>
      )}

      <button onClick={submit} disabled={!canSubmit || busy} className="btn-primary w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isPending ? 'Confirm in wallet…' : confirming ? 'Creating…' : 'Create proposal'}
      </button>

      {!isConnected && (
        <p className="text-center text-xs text-zinc-500">Connect your wallet to create a proposal.</p>
      )}
    </div>
  );
}
