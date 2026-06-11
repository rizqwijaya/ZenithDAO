# Credentials checklist

Collect these, then fill the three `.env` files (copy each `.env.example` → `.env` first).
**Never commit `.env` or share your private key.**

| # | Credential | Where to get it | Goes into |
|---|---|---|---|
| 1 | Deployer **private key** (0x-prefixed) | MetaMask → Account details → Show private key | `contracts/.env` → `PRIVATE_KEY` |
| 1 | **Sepolia ETH** (~0.05+) | cloud.google.com/application/web3/faucet/ethereum/sepolia · alchemy.com/faucets/ethereum-sepolia | (funds the deployer address) |
| 2 | **Alchemy RPC URL** | alchemy.com → Create App → Ethereum / Sepolia → API Key (HTTPS) | `contracts/.env` + `backend/.env` → `SEPOLIA_RPC_URL` |
| 2 | Alchemy **id** (the part after `/v2/`) | same URL | `frontend/.env` → `VITE_ALCHEMY_ID` |
| 3 | **Etherscan API key** | etherscan.io → API Keys → Add | `contracts/.env` → `ETHERSCAN_API_KEY` |
| 4 | **Reown / WalletConnect project id** | cloud.reown.com → Create Project | `frontend/.env` → `VITE_WALLETCONNECT_ID` |
| 5 | **PostgreSQL URL** | neon.tech (managed) or local `createdb zenithdao` | `backend/.env` → `DATABASE_URL` |

Addresses (`ZENITH_*` / `VITE_*_ADDRESS`, `TIMELOCK_ADDRESS`) are filled automatically
after deploy by `node packages/contracts/script/extract-addresses.mjs`.

## Order of operations
1. Fill `contracts/.env` (items 1–3) → `cd packages/contracts && forge test` → deploy (see [DEPLOYMENT.md](DEPLOYMENT.md)).
2. Run `extract-addresses.mjs` → addresses land in backend + frontend `.env`.
3. Fill `backend/.env` item 5 + `START_BLOCK` → run backend.
4. Fill `frontend/.env` items 2 + 4 → run / deploy frontend.
