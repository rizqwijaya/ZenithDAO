# ZenithDAO — Govern without limits

On-chain DAO governance protocol on Ethereum Sepolia. Holders of **$ZNTH** create proposals, vote, and execute treasury decisions trustlessly via smart contracts.

## Monorepo

```
packages/
├── contracts/   # Solidity + Foundry + OpenZeppelin
├── backend/     # Node.js + TypeScript + Fastify indexer + PostgreSQL
└── frontend/    # React + TypeScript + Vite + wagmi + RainbowKit
```

## Stack

| Layer | Tech |
|---|---|
| Contracts | Solidity ^0.8.20 · Foundry · OpenZeppelin Governor |
| Backend | Node 20 · Fastify · ethers v6 · PostgreSQL |
| Frontend | React 18 · Vite · wagmi v2 · viem · RainbowKit · TailwindCSS |

## Quick start

```bash
pnpm install

# Contracts
cd packages/contracts
forge install
forge build
forge test

# Backend
cd packages/backend
cp .env.example .env   # fill values
pnpm dev

# Frontend
cd packages/frontend
cp .env.example .env   # fill values
pnpm dev
```

## Deployment

See [packages/contracts/DEPLOY.md](packages/contracts/DEPLOY.md) for the Sepolia deploy + Etherscan verification runbook, and the per-package READMEs for backend/frontend hosting.

## Governance parameters (testnet)

| Parameter | Value |
|---|---|
| Voting delay | 1 block |
| Voting period | 50 blocks |
| Proposal threshold | 1,000 ZNTH |
| Quorum | 4% of supply |
| Timelock delay | 300 s |

---

*ZenithDAO — Govern without limits.*
