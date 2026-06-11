import { isAddress, type Address } from 'viem';

const asAddress = (v?: string): Address | undefined =>
  v && isAddress(v) ? (v as Address) : undefined;

export const GOVERNOR_ADDRESS = asAddress(import.meta.env.VITE_GOVERNOR_ADDRESS);
export const TOKEN_ADDRESS = asAddress(import.meta.env.VITE_TOKEN_ADDRESS);
export const VAULT_ADDRESS = asAddress(import.meta.env.VITE_VAULT_ADDRESS);
export const TIMELOCK_ADDRESS = asAddress(import.meta.env.VITE_TIMELOCK_ADDRESS);
export const FAUCET_ADDRESS = asAddress(import.meta.env.VITE_FAUCET_ADDRESS);

/** True only when the core governance addresses are configured. */
export const CONTRACTS_READY = Boolean(GOVERNOR_ADDRESS && TOKEN_ADDRESS && VAULT_ADDRESS);

export const ETHERSCAN = 'https://sepolia.etherscan.io';
export const etherscanTx = (hash: string) => `${ETHERSCAN}/tx/${hash}`;
export const etherscanAddress = (addr: string) => `${ETHERSCAN}/address/${addr}`;
