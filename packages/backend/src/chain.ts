import { ethers } from 'ethers';
import { config } from './config.js';
import { governorAbi, vaultAbi, tokenAbi } from './abis.js';

export const provider = config.rpcUrl ? new ethers.JsonRpcProvider(config.rpcUrl) : null;

function contract(address: string, abi: readonly string[]): ethers.Contract | null {
  if (!provider || !address) return null;
  return new ethers.Contract(address, abi as string[], provider);
}

export const governor = contract(config.addresses.governor, governorAbi);
export const vault = contract(config.addresses.vault, vaultAbi);
export const token = contract(config.addresses.token, tokenAbi);

/** Numeric Governor state -> string status (matches the proposals.status column). */
export const STATUS_BY_STATE: Record<number, string> = {
  0: 'pending',
  1: 'active',
  2: 'canceled',
  3: 'defeated',
  4: 'succeeded',
  5: 'queued',
  6: 'expired',
  7: 'executed',
};

/** Statuses that will never change again — no need to re-query the chain. */
export const TERMINAL_STATUSES = new Set(['canceled', 'defeated', 'expired', 'executed']);
