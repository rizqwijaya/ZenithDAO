import type { ReactNode } from 'react';
import { Loader2, Inbox, AlertCircle } from 'lucide-react';

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="text-zinc-600">{icon ?? <Inbox className="h-10 w-10" />}</div>
      <h3 className="text-base font-semibold text-zinc-200">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
      <AlertCircle className="h-10 w-10 text-rose-400" />
      <h3 className="text-base font-semibold text-zinc-200">Couldn’t reach the indexer</h3>
      <p className="max-w-sm text-sm text-zinc-500">
        {message ?? 'Make sure the backend is running and VITE_API_URL points to it.'}
      </p>
    </div>
  );
}
