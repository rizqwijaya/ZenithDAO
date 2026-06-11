# ZenithDAO Frontend

React + Vite dApp. wagmi v2 + viem + RainbowKit for wallet/chain, TailwindCSS for UI, TanStack Query for backend data.

## Setup

```bash
pnpm install
cp .env.example .env    # fill VITE_* values
pnpm dev                # http://localhost:5173
```

### Env

| Var | Purpose |
|---|---|
| `VITE_ALCHEMY_ID` | Alchemy app id for the Sepolia RPC transport |
| `VITE_WALLETCONNECT_ID` | WalletConnect / Reown project id (RainbowKit) |
| `VITE_API_URL` | Backend indexer base URL (default `http://localhost:3001`) |
| `VITE_GOVERNOR_ADDRESS` / `VITE_TOKEN_ADDRESS` / `VITE_VAULT_ADDRESS` / `VITE_TIMELOCK_ADDRESS` | Deployed contracts |

## Pages

| Route | Page |
|---|---|
| `/` | Dashboard — treasury balance, stats, active proposals |
| `/proposals` | All proposals + status filter |
| `/proposals/:id` | Detail — description, tally, timeline, vote/queue/execute |
| `/create` | Create a treasury proposal |
| `/delegate` | Delegate / activate voting power |

## How it reads data

- **Lists & history** come from the backend indexer (`VITE_API_URL`).
- **Live state** (`Governor.state`, voting power, treasury balance) is read directly
  on-chain via wagmi, so the UI is correct even if the indexer lags.
- **Writes** (vote, propose, delegate, queue, execute) go straight to the contracts.

## Deploy to Vercel

```bash
# from packages/frontend
vercel            # link + preview
vercel --prod     # production
```

- Build command: `pnpm build`  ·  Output dir: `dist`
- If deploying the monorepo root on Vercel, set the project root to `packages/frontend`.
- Add every `VITE_*` var in the Vercel project settings.
- `vercel.json` rewrites all routes to `index.html` for client-side routing.
