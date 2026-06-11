# ZenithDAO Backend Indexer

Fastify API + on-chain event indexer. Reads ZenithGovernor / ZenithVault / ZenithToken on Sepolia, stores into PostgreSQL, serves a REST API.

## Setup

```bash
pnpm install
cp .env.example .env     # fill DATABASE_URL, SEPOLIA_RPC_URL, contract addresses
```

Create the database (schema auto-applies on boot, but the DB must exist):

```bash
createdb zenithdao
# or: psql -c 'CREATE DATABASE zenithdao;'
```

## Run

```bash
pnpm dev      # tsx watch
# or
pnpm build && pnpm start
```

On boot the server applies `schema.sql`, serves the API, and starts the indexer
(only if `SEPOLIA_RPC_URL` + governor/vault addresses are set). It backfills from
`START_BLOCK` (or chain head) and polls every `POLL_INTERVAL_MS`.

## Indexed events

| Event | Contract | Table |
|---|---|---|
| `ProposalCreated` | ZenithGovernor | proposals |
| `VoteCast` / `VoteCastWithParams` | ZenithGovernor | votes (+ tallies) |
| `ProposalQueued` | ZenithGovernor | proposals.status = queued |
| `ProposalExecuted` | ZenithGovernor | proposals.status = executed |
| `ETHReceived` | ZenithVault | treasury_events (received) |
| `ETHExecuted` | ZenithVault | treasury_events (executed) |

Proposal status is also refreshed live from `Governor.state()` each poll, so
Active / Succeeded / Defeated stay accurate without a dedicated event.

## REST API

| Method | Route | Description |
|---|---|---|
| GET | `/health` | DB + chain + indexer status |
| GET | `/proposals` | All proposals (`?status=` filter) |
| GET | `/proposals/:id` | Proposal detail |
| GET | `/proposals/:id/votes` | Votes for a proposal |
| GET | `/treasury` | Vault ETH balance + tx history |
| GET | `/delegates/:address` | Voting power for an address |

## Deploy

Any Node 20+ host (Railway, Render, Fly.io, a VPS) plus a managed PostgreSQL.
Set the same env vars there. `pnpm build` then `pnpm start`.
