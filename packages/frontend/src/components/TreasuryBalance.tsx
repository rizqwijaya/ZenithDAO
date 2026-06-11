import { useBalance } from 'wagmi';
import { Wallet, ExternalLink } from 'lucide-react';
import { VAULT_ADDRESS, etherscanAddress } from '../config/contracts';
import { shortAddress } from '../lib/format';

export function TreasuryBalance() {
  const { data, isLoading } = useBalance({
    address: VAULT_ADDRESS,
    query: { enabled: Boolean(VAULT_ADDRESS), refetchInterval: 20_000 },
  });

  const formatted = data ? trimEth(data.formatted) : '0';

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-zenith-grad opacity-20 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-zinc-400">
          <Wallet className="h-4 w-4" />
          <span className="stat-label">Treasury balance</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-white">
            {isLoading ? '-' : formatted}
          </span>
          <span className="text-lg font-semibold text-zenith-300">ETH</span>
        </div>
        {VAULT_ADDRESS ? (
          <a
            href={etherscanAddress(VAULT_ADDRESS)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zenith-300"
          >
            {shortAddress(VAULT_ADDRESS, 6)}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <p className="mt-3 text-xs text-zinc-500">Vault address not configured</p>
        )}
      </div>
    </div>
  );
}

function trimEth(v: string): string {
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('en-US', { maximumFractionDigits: 5 });
}
