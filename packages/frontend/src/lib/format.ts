import { formatEther } from 'viem';

export function shortAddress(addr?: string | null, chars = 4): string {
  if (!addr) return '—';
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`;
}

/** Format a wei string/bigint as a trimmed ETH amount. */
export function fmtEth(wei: string | bigint | undefined, dp = 4): string {
  if (wei === undefined) return '0';
  try {
    const n = Number(formatEther(typeof wei === 'bigint' ? wei : BigInt(wei)));
    return trim(n, dp);
  } catch {
    return '0';
  }
}

/** Format a token amount (18 decimals) with thousands separators. */
export function fmtTokens(wei: string | bigint | undefined, dp = 0): string {
  if (wei === undefined) return '0';
  try {
    const n = Number(formatEther(typeof wei === 'bigint' ? wei : BigInt(wei)));
    return n.toLocaleString('en-US', { maximumFractionDigits: dp });
  } catch {
    return '0';
  }
}

export function compact(n: number): string {
  return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, (part / total) * 100));
}

function trim(n: number, dp: number): string {
  if (n === 0) return '0';
  const s = n.toFixed(dp);
  return s.replace(/\.?0+$/, '');
}

export function timeAgo(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '';
  const secs = Math.floor((Date.now() - d) / 1000);
  const units: [number, string][] = [
    [60, 's'],
    [60, 'm'],
    [24, 'h'],
    [7, 'd'],
    [4.345, 'w'],
    [12, 'mo'],
    [Number.POSITIVE_INFINITY, 'y'],
  ];
  let val = secs;
  let unit = 's';
  for (const [step, label] of units) {
    if (val < step) {
      unit = label;
      break;
    }
    val = Math.floor(val / step);
    unit = label;
  }
  return `${val}${unit} ago`;
}
