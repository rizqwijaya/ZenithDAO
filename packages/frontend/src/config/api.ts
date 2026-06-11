const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export interface ApiProposal {
  proposalId: string;
  proposer: string;
  description: string;
  startBlock: number | null;
  endBlock: number | null;
  status: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  createdAt: string;
}

export interface ApiVote {
  id: number;
  proposalId: string;
  voter: string;
  support: number;
  supportLabel: string;
  weight: string;
  weightFormatted: string;
  reason: string;
  blockNumber: number | null;
  createdAt: string;
}

export interface ApiTreasuryEvent {
  id: number;
  type: 'received' | 'executed';
  sender: string | null;
  target: string | null;
  amountWei: string;
  amountEth: string;
  txHash: string | null;
  blockNumber: number | null;
  createdAt: string;
}

export interface ApiTreasury {
  vault: string | null;
  balanceWei: string;
  balanceEth: string;
  events: ApiTreasuryEvent[];
}

export interface ApiDelegate {
  address: string;
  votes: string;
  votesFormatted: string;
  delegate: string;
  balance: string;
  balanceFormatted: string;
}

export interface ApiHealth {
  status: string;
  db: 'up' | 'down';
  chain: 'up' | 'down';
  blockNumber: number | null;
  indexer: boolean;
}
