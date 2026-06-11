# ZenithDAO - Full Deployment Runbook

Everything is built and tested locally. The remaining steps need **your** secrets
(a funded Sepolia wallet, an RPC URL, an Etherscan key, a Vercel account) - they
can't be done without them. Follow in order.

---

## Step 1 - Deploy + verify contracts (Sepolia)

Needs: funded deployer wallet, `SEPOLIA_RPC_URL`, `ETHERSCAN_API_KEY`.

```bash
cd packages/contracts
cp .env.example .env          # fill PRIVATE_KEY, SEPOLIA_RPC_URL, ETHERSCAN_API_KEY
forge test                    # 14 tests must pass
source .env
forge script script/Deploy.s.sol:Deploy --rpc-url sepolia --broadcast --verify -vvvv
```

Full detail + manual verification fallback: [packages/contracts/DEPLOY.md](packages/contracts/DEPLOY.md).

After it broadcasts, capture the four addresses into the other packages' env files:

```bash
cd ../..
node packages/contracts/script/extract-addresses.mjs
```

This writes `ZENITH_*` into `packages/backend/.env` and `VITE_*` into
`packages/frontend/.env`, and prints a block to paste into `GENERAL.md` section 7.

---

## Step 2 - Backend indexer + database

Needs: a PostgreSQL database, `SEPOLIA_RPC_URL`.

```bash
cd packages/backend
cp .env.example .env          # DATABASE_URL, SEPOLIA_RPC_URL (+ addresses from step 1)
# set START_BLOCK to the deploy block for a fast first sync
createdb zenithdao            # or point DATABASE_URL at a managed PG (Neon/Supabase/Railway)
pnpm dev
```

Verify:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/proposals
curl http://localhost:3001/treasury
```

Host it on any Node 20+ platform (Railway / Render / Fly.io) with a managed
PostgreSQL. `pnpm build && pnpm start`.

---

## Step 3 - Frontend dApp + Vercel

Needs: a Vercel account, `VITE_WALLETCONNECT_ID` (https://cloud.reown.com),
optionally `VITE_ALCHEMY_ID`.

```bash
cd packages/frontend
cp .env.example .env          # VITE_* (addresses from step 1, API URL from step 2)
pnpm dev                      # http://localhost:5173
```

Deploy:

```bash
npm i -g vercel
vercel            # set project root to packages/frontend if prompted
vercel --prod
```

In the Vercel project settings:
- **Root directory:** `packages/frontend`
- **Build command:** `pnpm build`  ·  **Output:** `dist`
- Add every `VITE_*` env var (including the deployed addresses + your hosted `VITE_API_URL`).

---

## Step 4 - First-run governance smoke test

1. Open the dApp, connect a wallet holding ZNTH (the deployer holds all 1,000,000).
2. **Delegate** to yourself (`/delegate`) - voting power is 0 until you do.
3. **Create** a treasury proposal (`/create`). Fund the vault first by sending it
   some Sepolia ETH so a payout can execute.
4. Wait 1 block, **vote** For.
5. After 50 blocks, **Queue**, wait 300s, **Execute**. ETH leaves the treasury.

---

## What needs your credentials (summary)

| Step | Secret / account |
|---|---|
| Deploy contracts | Funded Sepolia `PRIVATE_KEY`, `SEPOLIA_RPC_URL` |
| Verify on Etherscan | `ETHERSCAN_API_KEY` |
| Backend | PostgreSQL `DATABASE_URL`, `SEPOLIA_RPC_URL` |
| Frontend wallets | `VITE_WALLETCONNECT_ID` (Reown) |
| Hosting | Vercel account (frontend), Node host + PG (backend) |
