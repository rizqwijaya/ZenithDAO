import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/zenithdao',
  rpcUrl: process.env.SEPOLIA_RPC_URL ?? '',
  addresses: {
    token: (process.env.ZENITH_TOKEN_ADDRESS ?? '').trim(),
    governor: (process.env.ZENITH_GOVERNOR_ADDRESS ?? '').trim(),
    vault: (process.env.ZENITH_VAULT_ADDRESS ?? '').trim(),
    timelock: (process.env.TIMELOCK_ADDRESS ?? '').trim(),
  },
  startBlock: process.env.START_BLOCK ? Number(process.env.START_BLOCK) : undefined,
  pollIntervalMs: Number(process.env.POLL_INTERVAL_MS ?? 12000),
  logChunkSize: Number(process.env.LOG_CHUNK_SIZE ?? 2000),
} as const;

/** The indexer can only run with an RPC URL and the governor + vault addresses. */
export function indexerEnabled(): boolean {
  return Boolean(config.rpcUrl && config.addresses.governor && config.addresses.vault);
}

/** Chain reads (treasury balance, voting power) need an RPC URL. */
export function chainEnabled(): boolean {
  return Boolean(config.rpcUrl);
}
