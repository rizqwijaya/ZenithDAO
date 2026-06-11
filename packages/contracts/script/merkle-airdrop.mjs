// Build the Merkle airdrop artifacts for the ZNTH distribution.
//
//   node script/merkle-airdrop.mjs
//
// Reads  script/airdrop/recipients.json  -> [{ "address": "0x..", "amount": "1000" }]
//        (amount is in whole ZNTH; converted to 18-decimal wei here)
// Writes script/airdrop/merkle.json      -> { root, total, claims: { addr: { amount, proof } } }
//
// The `root` feeds the MerkleDistributor constructor; the frontend serves each
// recipient their { amount, proof } so they can call claim().

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const RECIPIENTS = resolve(here, 'airdrop/recipients.json');
const OUT = resolve(here, 'airdrop/merkle.json');
const DECIMALS = 18n;

function toWei(amount) {
  // Accept whole or fractional token amounts ("1000" or "12.5") without floats.
  const [whole, frac = ''] = String(amount).trim().split('.');
  const padded = (frac + '0'.repeat(Number(DECIMALS))).slice(0, Number(DECIMALS));
  return BigInt(whole || '0') * 10n ** DECIMALS + BigInt(padded || '0');
}

const recipients = JSON.parse(readFileSync(RECIPIENTS, 'utf8'));
if (!Array.isArray(recipients) || recipients.length === 0) {
  throw new Error('recipients.json must be a non-empty array of { address, amount }');
}

// Dedupe + validate: one allocation per address (matches the contract's per-address claim flag).
const seen = new Set();
const values = recipients.map(({ address, amount }) => {
  const addr = String(address).trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) throw new Error(`Bad address: ${address}`);
  const key = addr.toLowerCase();
  if (seen.has(key)) throw new Error(`Duplicate address: ${addr}`);
  seen.add(key);
  return [addr, toWei(amount).toString()];
});

const tree = StandardMerkleTree.of(values, ['address', 'uint256']);

const claims = {};
let total = 0n;
for (const [i, [addr, amountWei]] of tree.entries()) {
  claims[addr] = { amount: amountWei, proof: tree.getProof(i) };
  total += BigInt(amountWei);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ root: tree.root, total: total.toString(), count: values.length, claims }, null, 2),
);

console.log('Merkle root :', tree.root);
console.log('Recipients  :', values.length);
console.log('Total (wei) :', total.toString());
console.log('Total (ZNTH):', (total / 10n ** DECIMALS).toString());
console.log('Written     :', OUT);
console.log('\nNext: deploy with this root, then fund the distributor with the total above.');
console.log('  $env:MERKLE_ROOT="' + tree.root + '"');
console.log('  $env:AIRDROP_TOTAL="' + total.toString() + '"');
