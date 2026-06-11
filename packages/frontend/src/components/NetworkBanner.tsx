import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { AlertTriangle } from 'lucide-react';
import { CONTRACTS_READY } from '../config/contracts';
import { CHAIN } from '../config/wagmi';

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  if (!CONTRACTS_READY) {
    return (
      <Banner>
        Contract addresses are not configured. Set <code className="text-zenith-300">VITE_GOVERNOR_ADDRESS</code>,{' '}
        <code className="text-zenith-300">VITE_TOKEN_ADDRESS</code> and{' '}
        <code className="text-zenith-300">VITE_VAULT_ADDRESS</code> in <code>.env</code> after deploying.
      </Banner>
    );
  }

  if (isConnected && chainId !== CHAIN.id) {
    return (
      <Banner>
        Wrong network. ZenithDAO runs on {CHAIN.name}.{' '}
        <button
          onClick={() => switchChain({ chainId: CHAIN.id })}
          className="ml-1 font-semibold text-amber-200 underline underline-offset-2"
        >
          Switch to {CHAIN.name}
        </button>
      </Banner>
    );
  }

  return null;
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-xs text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{children}</span>
      </div>
    </div>
  );
}
