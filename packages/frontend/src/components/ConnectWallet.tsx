import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ChevronDown, AlertTriangle } from 'lucide-react';

/**
 * Themed wallet button built on RainbowKit's render-prop API so it matches the
 * app's blue gradient and gains hover/press motion. Falls back through the three
 * RainbowKit states: disconnected, wrong-network, connected.
 */
export function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            aria-hidden={!ready}
            className={!ready ? 'pointer-events-none select-none opacity-0' : ''}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button" className="btn-connect group">
                    <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="btn inline-flex animate-pulse items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-500/25"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="hidden items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-sm font-medium text-zinc-200 transition hover:border-zenith-500/40 hover:bg-white/10 sm:inline-flex"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? 'Chain'}
                        className="h-4 w-4 rounded-full"
                      />
                    )}
                    <span className="max-w-[7rem] truncate">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="group inline-flex items-center gap-2 rounded-xl border border-zenith-500/30 bg-zenith-500/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-zenith-400/50 hover:bg-zenith-500/20 hover:shadow-glow"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/70" />
                    <span className="max-w-[8rem] truncate">{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="hidden text-xs font-normal text-zinc-400 md:inline">
                        {account.displayBalance}
                      </span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-y-0.5" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
