import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pgPkg from 'pg';
import type { QueryResultRow } from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { config } from './config.js';

/** Minimal pool surface shared by node-postgres and the Neon serverless driver. */
interface DbPool {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
  on(event: 'error', listener: (err: Error) => void): void;
  end(): Promise<void>;
}

// Neon hosts are reached over HTTPS/WebSocket (port 443) via the serverless
// driver — this works on networks that block the raw Postgres port (5432).
// Any other URL uses plain node-postgres.
const isNeon = /neon\.tech/i.test(config.databaseUrl);

function createPool(): DbPool {
  if (isNeon) {
    neonConfig.webSocketConstructor = ws;
    return new NeonPool({ connectionString: config.databaseUrl }) as unknown as DbPool;
  }
  return new pgPkg.Pool({ connectionString: config.databaseUrl }) as unknown as DbPool;
}

export const pool = createPool();

// Prevent an idle-client connection error from crashing the process.
pool.on('error', () => {
  /* swallowed — surfaced via /health and per-query try/catch */
});

// schema.sql lives at the package root, one level above both src/ (dev) and dist/ (prod).
const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '..', 'schema.sql');

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter(
      (s) => s.length > 0 && !s.split('\n').every((l) => l.trim() === '' || l.trim().startsWith('--')),
    );
}

export async function initDb(): Promise<void> {
  const statements = splitStatements(readFileSync(schemaPath, 'utf8'));
  // Serverless Postgres can reset/stall the first connection while waking from
  // idle — retry the whole batch a few times before giving up.
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      for (const stmt of statements) await pool.query(stmt);
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastErr;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function ping(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

// --- indexer cursor --------------------------------------------------------

export async function getCursor(): Promise<number | null> {
  const rows = await query<{ last_block: string }>(
    'SELECT last_block FROM indexer_state WHERE id = 1',
  );
  return rows.length ? Number(rows[0].last_block) : null;
}

export async function setCursor(block: number): Promise<void> {
  await pool.query(
    `INSERT INTO indexer_state (id, last_block, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id) DO UPDATE SET last_block = EXCLUDED.last_block, updated_at = NOW()`,
    [block],
  );
}
