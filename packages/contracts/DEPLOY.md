# ZenithDAO - Deployment Runbook (Sepolia)

End-to-end deploy + Etherscan verification for the four contracts. Needs three secrets you supply in `.env`.

## 0. Prerequisites

- Foundry installed (`forge --version`)
- A deployer wallet with **Sepolia ETH** (faucet: https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia)
- A Sepolia RPC URL (Alchemy / Infura)
- An Etherscan API key (https://etherscan.io/myapikey)

## 1. Configure secrets

```bash
cd packages/contracts
cp .env.example .env
```

Fill `.env`:

```bash
PRIVATE_KEY=abc123...        # deployer key, NO 0x prefix
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<KEY>
ETHERSCAN_API_KEY=<KEY>
```

> `.env` is gitignored. Never commit a real private key.

## 2. Build + test (must be green before deploying)

```bash
forge build
forge test -vvv
```

Expect **14 passing** tests.

## 3. Dry run (no broadcast)

```bash
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia -vvvv
```

## 4. Deploy + verify

```bash
source .env
forge script script/Deploy.s.sol:Deploy \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  -vvvv
```

The deploy order (from `Deploy.s.sol`):

1. `ZenithToken` - mints 1,000,000 ZNTH to deployer
2. `TimelockController` - 300s delay, open executor (`address(0)`), deployer as admin
3. `ZenithGovernor` - wired to token + timelock
4. `ZenithVault` - admin + executor = timelock
5. Grants `PROPOSER_ROLE` + `CANCELLER_ROLE` on the timelock to the governor

The four addresses are printed at the end via `console.log` and also saved by Forge to
`broadcast/Deploy.s.sol/11155111/run-latest.json`.

## 5. Capture addresses into backend/frontend env

From the repo root, after a successful broadcast:

```bash
node packages/contracts/script/extract-addresses.mjs
```

This reads `run-latest.json` and writes the four addresses into:

- `packages/backend/.env`  (`ZENITH_TOKEN_ADDRESS`, `ZENITH_GOVERNOR_ADDRESS`, `ZENITH_VAULT_ADDRESS`, `TIMELOCK_ADDRESS`)
- `packages/frontend/.env` (`VITE_TOKEN_ADDRESS`, `VITE_GOVERNOR_ADDRESS`, `VITE_VAULT_ADDRESS`, `VITE_TIMELOCK_ADDRESS`)

It also prints a block you can paste into the repo-root `GENERAL.md` section 7.

## 6. Manual verification (if `--verify` was skipped or failed)

```bash
source .env
forge verify-contract <ADDRESS> src/ZenithToken.sol:ZenithToken \
  --chain sepolia --watch \
  --constructor-args $(cast abi-encode "constructor(address)" <DEPLOYER>)
```

Repeat per contract with the matching constructor signature:

| Contract | Constructor signature | Args |
|---|---|---|
| ZenithToken | `constructor(address)` | deployer |
| TimelockController | `constructor(uint256,address[],address[],address)` | `300`, `[]`, `[0x0]`, deployer |
| ZenithGovernor | `constructor(address,address)` | token, timelock |
| ZenithVault | `constructor(address)` | timelock |

## 7. Post-deploy sanity (optional)

```bash
# voting power of deployer (0 until they self-delegate)
cast call <TOKEN> "getVotes(address)(uint256)" <DEPLOYER> --rpc-url sepolia

# self-delegate so you can propose/vote
cast send <TOKEN> "delegate(address)" <DEPLOYER> --rpc-url sepolia --private-key $PRIVATE_KEY
```
