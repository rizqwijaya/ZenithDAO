import { DelegatePanel } from '../components/DelegatePanel';

export function Delegate() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Delegate voting power</h1>
        <p className="mt-1 text-sm text-zinc-400">
          ERC20Votes tokens are inert until delegated. Activate yours to participate in governance.
        </p>
      </div>
      <DelegatePanel />
    </div>
  );
}
