import { ClaimPanel } from '../components/ClaimPanel';
import { AddTokenCard } from '../components/AddTokenCard';

export function Claim() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">ZNTH faucet</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Grab test ZNTH to try governance. Open to any wallet, with a cooldown between claims.
        </p>
      </div>
      <ClaimPanel />
      <AddTokenCard />
    </div>
  );
}
