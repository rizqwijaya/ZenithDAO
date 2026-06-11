import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { NetworkBanner } from './NetworkBanner';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <NetworkBanner />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-white/10 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-zinc-500 sm:flex-row">
          <span>ZenithDAO - Govern without limits.</span>
          <span>Ethereum Sepolia testnet</span>
        </div>
      </footer>
    </div>
  );
}
