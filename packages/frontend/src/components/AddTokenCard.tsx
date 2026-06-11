import { useState } from 'react';
import { useWalletClient } from 'wagmi';
import { Copy, Check, ExternalLink, Plus, Coins } from 'lucide-react';
import { TOKEN_ADDRESS, etherscanAddress } from '../config/contracts';

const SYMBOL = 'ZNTH';
const DECIMALS = 18;

/**
 * Shows the ZNTH contract address (copyable + on Etherscan) and a one-click
 * "Add to wallet" using EIP-747 (wallet_watchAsset), so claimed tokens show up
 * in the user's wallet instead of looking like nothing happened.
 */
export function AddTokenCard() {
  const { data: walletClient } = useWalletClient();
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!TOKEN_ADDRESS) return null;

  async function copy() {
    if (!TOKEN_ADDRESS) return;
    try {
      await navigator.clipboard.writeText(TOKEN_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked; user can still select the address manually */
    }
  }

  async function addToWallet() {
    setError(null);
    if (!walletClient || !TOKEN_ADDRESS) {
      setError('Connect your wallet first.');
      return;
    }
    try {
      await walletClient.watchAsset({
        type: 'ERC20',
        options: { address: TOKEN_ADDRESS, symbol: SYMBOL, decimals: DECIMALS },
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add the token.');
    }
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-zenith-300" />
        <h3 className="text-base font-semibold text-white">Add ZNTH to your wallet</h3>
      </div>
      <p className="text-sm text-zinc-400">
        Wallets don’t show custom tokens until you import them. Add the contract so your ZNTH balance
        appears.
      </p>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-300">{TOKEN_ADDRESS}</span>
        <button
          onClick={copy}
          title="Copy address"
          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={etherscanAddress(TOKEN_ADDRESS)}
          target="_blank"
          rel="noreferrer"
          title="View on Etherscan"
          className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <button onClick={addToWallet} className="btn-ghost w-full">
        {added ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
        {added ? 'Added' : 'Add to wallet'}
      </button>

      {error && (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {error.length > 140 ? `${error.slice(0, 137)}…` : error}
        </p>
      )}
    </div>
  );
}
