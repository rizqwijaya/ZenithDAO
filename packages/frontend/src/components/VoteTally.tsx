import { fmtTokens, pct } from '../lib/format';

interface VoteTallyProps {
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  compact?: boolean;
}

export function VoteTally({ forVotes, againstVotes, abstainVotes, compact = false }: VoteTallyProps) {
  const f = safeBig(forVotes);
  const a = safeBig(againstVotes);
  const ab = safeBig(abstainVotes);
  const total = f + a + ab;
  const t = Number(total) || 0;

  const rows = [
    { label: 'For', value: f, color: 'bg-emerald-400', text: 'text-emerald-300' },
    { label: 'Against', value: a, color: 'bg-rose-400', text: 'text-rose-300' },
    { label: 'Abstain', value: ab, color: 'bg-zinc-400', text: 'text-zinc-300' },
  ];

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {rows.map((row) => {
        const p = pct(Number(row.value), t);
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className={`font-semibold ${row.text}`}>{row.label}</span>
              <span className="tabular-nums text-zinc-400">
                {fmtTokens(row.value)} ZNTH · {p.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full ${row.color} transition-all`} style={{ width: `${p}%` }} />
            </div>
          </div>
        );
      })}
      {!compact && (
        <div className="pt-1 text-xs text-zinc-500">
          Total cast: <span className="text-zinc-300">{fmtTokens(total)} ZNTH</span>
        </div>
      )}
    </div>
  );
}

function safeBig(v?: string): bigint {
  try {
    return BigInt(v ?? '0');
  } catch {
    return 0n;
  }
}
