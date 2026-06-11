export type ProposalStatus =
  | 'pending'
  | 'active'
  | 'canceled'
  | 'defeated'
  | 'succeeded'
  | 'queued'
  | 'expired'
  | 'executed';

/** Governor.state() numeric value -> status string. */
export const STATE_TO_STATUS: ProposalStatus[] = [
  'pending',
  'active',
  'canceled',
  'defeated',
  'succeeded',
  'queued',
  'expired',
  'executed',
];

export interface StatusMeta {
  label: string;
  className: string;
  dot: string;
}

export const STATUS_META: Record<string, StatusMeta> = {
  pending: {
    label: 'Pending',
    className: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    dot: 'bg-amber-400',
  },
  active: {
    label: 'Active',
    className: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    dot: 'bg-sky-400',
  },
  succeeded: {
    label: 'Succeeded',
    className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  queued: {
    label: 'Queued',
    className: 'text-violet-300 bg-violet-500/10 border-violet-500/30',
    dot: 'bg-violet-400',
  },
  executed: {
    label: 'Executed',
    className: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  defeated: {
    label: 'Defeated',
    className: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    dot: 'bg-rose-400',
  },
  canceled: {
    label: 'Canceled',
    className: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
  expired: {
    label: 'Expired',
    className: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30',
    dot: 'bg-zinc-400',
  },
};

export function statusMeta(status?: string): StatusMeta {
  return STATUS_META[status ?? ''] ?? STATUS_META.pending;
}

/** Short, human title from a proposal description (first line). */
export function proposalTitle(description?: string): string {
  if (!description) return 'Untitled proposal';
  const firstLine = description.split('\n')[0].trim();
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine || 'Untitled proposal';
}
