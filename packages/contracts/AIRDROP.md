# ZNTH Merkle Airdrop - Runbook

Distribute ZNTH fairly to many addresses without paying gas for each transfer.
Eligibility is committed to a Merkle root on-chain; each recipient claims their
own slice with a proof. Unclaimed tokens can be swept back to the DAO treasury.

## Pieces

| File | Role |
|---|---|
| [src/MerkleDistributor.sol](src/MerkleDistributor.sol) | Holds tokens, verifies proofs, one claim per address, owner `sweep()` |
| [script/merkle-airdrop.mjs](script/merkle-airdrop.mjs) | Builds the Merkle root + per-recipient proofs |
| [script/airdrop/recipients.json](script/airdrop/recipients.json) | Input: `[{ address, amount }]` (amount in whole ZNTH) |
| `script/airdrop/merkle.json` | Output: `{ root, total, claims }` (the frontend serves `claims`) |
| [script/DeployAirdrop.s.sol](script/DeployAirdrop.s.sol) | Deploys + funds the distributor |

## Steps

### 1. List recipients

Edit [script/airdrop/recipients.json](script/airdrop/recipients.json):

```json
[
  { "address": "0xRecipient1", "amount": "10000" },
  { "address": "0xRecipient2", "amount": "5000" }
]
```

One entry per address. `amount` is in whole ZNTH (fractions like `12.5` are fine).

### 2. Generate the tree

```powershell
pnpm --filter @zenithdao/contracts airdrop:gen
```

Prints the **root** and **total**, writes `script/airdrop/merkle.json`.

### 3. Deploy + fund

The deployer wallet must hold at least the total. Owner = who can sweep later;
set it to the **timelock** so the DAO controls leftovers.

```powershell
$env:TOKEN_ADDRESS  = "0x972624d7e3fcacedd6a247397cc5899f991b8ce8"
$env:MERKLE_ROOT    = "<root from step 2>"
$env:AIRDROP_TOTAL  = "<total wei from step 2>"
$env:AIRDROP_OWNER  = "0x4f29536a65c4194cd868a3be7161a32a97d96097"  # timelock (optional)

pnpm --filter @zenithdao/contracts deploy:airdrop:sepolia
```

(`deploy:airdrop:sepolia:dry` simulates without broadcasting.)

### 4. Claim

Recipients call `claim(account, amount, proof)` with their entry from
`merkle.json`. Anyone may submit the tx; tokens always land on `account`. To
accrue voting power they still `delegate()` afterwards.

### 5. Sweep (optional)

After the window, the owner reclaims the unclaimed remainder:

```solidity
distributor.sweep(treasury);
```

## Why this is fair

- The allocation is fixed and public *before* deploy (the root commits to it).
- The deployer cannot mint more or alter amounts after the fact.
- Each address claims exactly its committed amount, once.
- Leftovers return to the DAO, not to the deployer's personal wallet
  (when owner = timelock).
