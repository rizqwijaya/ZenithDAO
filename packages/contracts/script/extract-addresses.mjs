#!/usr/bin/env node
// Reads the latest Forge broadcast for the Sepolia deploy and writes the four
// contract addresses into packages/backend/.env and packages/frontend/.env.
//
// Usage (from repo root or anywhere):
//   node packages/contracts/script/extract-addresses.mjs [chainId]
//
// Default chainId = 11155111 (Sepolia).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsDir = resolve(__dirname, '..');
const repoRoot = resolve(contractsDir, '..', '..');

const chainId = process.argv[2] ?? '11155111';
const broadcastPath = resolve(
  contractsDir,
  'broadcast',
  'Deploy.s.sol',
  chainId,
  'run-latest.json',
);

if (!existsSync(broadcastPath)) {
  console.error(`✗ Broadcast file not found: ${broadcastPath}`);
  console.error('  Run the deploy first:  pnpm deploy:sepolia');
  process.exit(1);
}

const broadcast = JSON.parse(readFileSync(broadcastPath, 'utf8'));

const wanted = ['ZenithToken', 'TimelockController', 'ZenithGovernor', 'ZenithVault'];
const found = {};
for (const tx of broadcast.transactions ?? []) {
  if (tx.transactionType === 'CREATE' && wanted.includes(tx.contractName)) {
    found[tx.contractName] = tx.contractAddress;
  }
}

const missing = wanted.filter((name) => !found[name]);
if (missing.length) {
  console.error(`✗ Missing addresses for: ${missing.join(', ')}`);
  process.exit(1);
}

const { ZenithToken, TimelockController, ZenithGovernor, ZenithVault } = found;

/** Upsert KEY=VALUE pairs into an env file, preserving every other line. */
function upsertEnv(envPath, pairs) {
  let lines = existsSync(envPath) ? readFileSync(envPath, 'utf8').split(/\r?\n/) : [];
  for (const [key, value] of Object.entries(pairs)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const line = `${key}=${value}`;
    if (idx >= 0) lines[idx] = line;
    else lines.push(line);
  }
  // Drop trailing empties, keep one terminal newline.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  writeFileSync(envPath, lines.join('\n') + '\n');
  console.log(`✓ Updated ${envPath}`);
}

upsertEnv(resolve(repoRoot, 'packages', 'backend', '.env'), {
  ZENITH_TOKEN_ADDRESS: ZenithToken,
  ZENITH_GOVERNOR_ADDRESS: ZenithGovernor,
  ZENITH_VAULT_ADDRESS: ZenithVault,
  TIMELOCK_ADDRESS: TimelockController,
});

upsertEnv(resolve(repoRoot, 'packages', 'frontend', '.env'), {
  VITE_TOKEN_ADDRESS: ZenithToken,
  VITE_GOVERNOR_ADDRESS: ZenithGovernor,
  VITE_VAULT_ADDRESS: ZenithVault,
  VITE_TIMELOCK_ADDRESS: TimelockController,
});

console.log('\nPaste into GENERAL.md section 7:\n');
console.log('Network:        Ethereum Sepolia');
console.log(`ZenithToken:    ${ZenithToken}`);
console.log(`TimelockCtrl:   ${TimelockController}`);
console.log(`ZenithGovernor: ${ZenithGovernor}`);
console.log(`ZenithVault:    ${ZenithVault}`);
