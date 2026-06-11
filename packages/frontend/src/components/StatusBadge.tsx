import { statusMeta } from '../lib/status';

export function StatusBadge({ status }: { status?: string }) {
  const meta = statusMeta(status);
  return (
    <span className={`badge ${meta.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
