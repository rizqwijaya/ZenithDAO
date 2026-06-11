# ZenithDAO - Project Specification

> **Tagline:** Govern without limits.  
> **Stack:** Solidity · Foundry · OpenZeppelin · Node.js · TypeScript · React · wagmi · TailwindCSS  
> **Network:** Ethereum Sepolia testnet  
> **Target:** 1 hari pengerjaan penuh (scaffold + contracts + backend + frontend)

---

## 1. Overview

ZenithDAO adalah protokol governance on-chain yang memungkinkan komunitas mengelola treasury bersama secara transparan dan trustless. Holder token **$ZNTH** dapat membuat proposal, melakukan voting, dan mengeksekusi keputusan secara otomatis melalui smart contract - tanpa perantara, tanpa kepercayaan buta kepada individu manapun.

### Komponen utama

| Komponen | Teknologi | Fungsi |
|---|---|---|
| Smart contracts | Solidity + Foundry + OpenZeppelin | Governance logic, treasury, token |
| Backend indexer | Node.js + TypeScript + Fastify | Index on-chain events ke database |
| Frontend dApp | React + TypeScript + wagmi + Vite | UI proposal, voting, treasury |

---

## 2. Monorepo Structure

```
zenithdao/
├── packages/
│   ├── contracts/          # Solidity + Foundry
│   ├── backend/            # Node.js + Fastify indexer
│   └── frontend/           # React + Vite dApp
├── package.json            # pnpm workspace root
├── pnpm-workspace.yaml
└── GENERAL.md              # file ini
```

---

## 3. Smart Contracts

### 3.1 ZenithToken.sol

**Path:** `packages/contracts/src/ZenithToken.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ZenithToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(address initialHolder)
        ERC20("Zenith Governance Token", "ZNTH")
        ERC20Permit("Zenith Governance Token")
    {
        _mint(initialHolder, 1_000_000 * 10 ** decimals());
    }

    // Required overrides
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal override(ERC20, ERC20Votes) { super._afterTokenTransfer(from, to, amount); }

    function _mint(address to, uint256 amount)
        internal override(ERC20, ERC20Votes) { super._mint(to, amount); }

    function _burn(address account, uint256 amount)
        internal override(ERC20, ERC20Votes) { super._burn(account, amount); }
}
```

**Fungsi kunci:**
- `delegate(address delegatee)` - aktifkan voting power (wajib dipanggil sebelum bisa vote)
- `getPastVotes(address, blockNumber)` - snapshot voting power per blok
- Total supply: **1.000.000 ZNTH** di-mint ke deployer

---

### 3.2 ZenithGovernor.sol

**Path:** `packages/contracts/src/ZenithGovernor.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract ZenithGovernor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(IVotes _token, TimelockController _timelock)
        Governor("ZenithGovernor")
        GovernorSettings(
            1,          // votingDelay: 1 blok
            50,         // votingPeriod: 50 blok (testnet)
            1000e18     // proposalThreshold: 1.000 ZNTH
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)  // quorum: 4% total supply
        GovernorTimelockControl(_timelock)
    {}
}
```

**Parameter governance (testnet):**

| Parameter | Nilai | Keterangan |
|---|---|---|
| `votingDelay` | 1 blok | Jeda setelah proposal dibuat |
| `votingPeriod` | 50 blok | Durasi voting aktif |
| `proposalThreshold` | 1.000 ZNTH | Minimum token untuk propose |
| `quorumNumerator` | 4% | Minimum partisipasi voter |
| `timelockDelay` | 300 detik | Masa tunggu sebelum eksekusi |

---

### 3.3 ZenithVault.sol

**Path:** `packages/contracts/src/ZenithVault.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZenithVault is AccessControl {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    event ETHReceived(address indexed sender, uint256 amount);
    event ETHExecuted(address indexed target, uint256 amount);
    event ERC20Executed(address indexed token, address indexed to, uint256 amount);

    constructor(address timelockAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, timelockAddress);
        _grantRole(EXECUTOR_ROLE, timelockAddress);
    }

    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    function executeETH(address payable target, uint256 amount)
        external onlyRole(EXECUTOR_ROLE)
    {
        require(address(this).balance >= amount, "Insufficient ETH");
        (bool success, ) = target.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHExecuted(target, amount);
    }

    function executeERC20(address token, address to, uint256 amount)
        external onlyRole(EXECUTOR_ROLE)
    {
        IERC20(token).transfer(to, amount);
        emit ERC20Executed(token, to, amount);
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
```

**Akses kontrol:**
- Hanya `TimelockController` yang bisa panggil `executeETH()` dan `executeERC20()`
- Tidak ada individu yang bisa akses langsung

---

### 3.4 Deploy Script

**Path:** `packages/contracts/script/Deploy.s.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZenithToken.sol";
import "../src/ZenithGovernor.sol";
import "../src/ZenithVault.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy token
        ZenithToken token = new ZenithToken(deployer);

        // 2. Deploy timelock (300 detik delay untuk testnet)
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // siapapun bisa eksekusi
        TimelockController timelock = new TimelockController(
            300, proposers, executors, deployer
        );

        // 3. Deploy governor
        ZenithGovernor governor = new ZenithGovernor(token, timelock);

        // 4. Deploy vault (owner = timelock)
        ZenithVault vault = new ZenithVault(address(timelock));

        // 5. Grant proposer role ke governor di timelock
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // 6. Revoke admin dari deployer (opsional - fully decentralized)
        // timelock.revokeRole(timelock.TIMELOCK_ADMIN_ROLE(), deployer);

        vm.stopBroadcast();

        console.log("ZenithToken deployed at:", address(token));
        console.log("TimelockController deployed at:", address(timelock));
        console.log("ZenithGovernor deployed at:", address(governor));
        console.log("ZenithVault deployed at:", address(vault));
    }
}
```

---

### 3.5 Foundry Tests

**Path:** `packages/contracts/test/`

#### ZenithToken.t.sol - test token dan voting power
```
- test_MintOnDeploy()         → total supply = 1.000.000 ZNTH
- test_DelegateToSelf()       → voting power aktif setelah delegate
- test_VotingPowerSnapshot()  → getPastVotes() return nilai yang benar
- test_TransferResetsVotes()  → voting power pindah ke holder baru
```

#### ZenithGovernor.t.sol - full proposal lifecycle
```
- test_CreateProposal()       → propose() berhasil, return proposalId
- test_VotingPeriod()         → state berubah: Pending → Active
- test_CastVote()             → vote terhitung, tally update
- test_ProposalSucceeds()     → quorum tercapai, state: Succeeded
- test_ProposalDefeated()     → mayoritas tolak, state: Defeated
- test_QueueAndExecute()      → full flow: queue → timelock → execute → dana keluar
```

#### ZenithVault.t.sol - treasury access control
```
- test_ReceiveETH()           → vault bisa terima ETH
- test_OnlyTimelockCanExecute → revert kalau bukan timelock
- test_ExecuteETH()           → ETH berhasil kirim ke target
```

---

## 4. Backend Indexer

**Path:** `packages/backend/`

### Stack
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Fastify
- **Database:** PostgreSQL
- **Blockchain:** ethers.js v6 / viem

### Events yang di-index

| Event | Contract | Data |
|---|---|---|
| `ProposalCreated` | ZenithGovernor | proposalId, proposer, description, startBlock, endBlock |
| `VoteCast` | ZenithGovernor | voter, proposalId, support (0/1/2), weight, reason |
| `ProposalQueued` | ZenithGovernor | proposalId, eta |
| `ProposalExecuted` | ZenithGovernor | proposalId |
| `ETHReceived` | ZenithVault | sender, amount |
| `ETHExecuted` | ZenithVault | target, amount |

### REST Endpoints

```
GET  /health                        → health check
GET  /proposals                     → list semua proposal + status
GET  /proposals/:id                 → detail proposal
GET  /proposals/:id/votes           → semua votes untuk proposal
GET  /treasury                      → ETH balance + transaction history
GET  /delegates/:address            → voting power address tertentu
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE proposals (
  proposal_id   TEXT PRIMARY KEY,
  proposer      TEXT NOT NULL,
  description   TEXT,
  start_block   BIGINT,
  end_block     BIGINT,
  status        TEXT DEFAULT 'pending',
  for_votes     TEXT DEFAULT '0',
  against_votes TEXT DEFAULT '0',
  abstain_votes TEXT DEFAULT '0',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votes (
  id          SERIAL PRIMARY KEY,
  proposal_id TEXT REFERENCES proposals(proposal_id),
  voter       TEXT NOT NULL,
  support     SMALLINT NOT NULL,  -- 0=against, 1=for, 2=abstain
  weight      TEXT NOT NULL,
  reason      TEXT,
  block_number BIGINT,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE treasury_events (
  id          SERIAL PRIMARY KEY,
  event_type  TEXT NOT NULL,  -- 'received' | 'executed'
  sender      TEXT,
  target      TEXT,
  amount      TEXT NOT NULL,
  tx_hash     TEXT,
  block_number BIGINT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Frontend dApp

**Path:** `packages/frontend/`

### Stack
- **Framework:** React 18 + TypeScript + Vite
- **Web3:** wagmi v2 + viem + RainbowKit
- **Styling:** TailwindCSS v3
- **Icons:** Lucide React

### Halaman & Routes

```
/                    → Dashboard: treasury balance, stats, proposal aktif
/proposals           → List semua proposal dengan status filter
/proposals/:id       → Detail proposal: deskripsi, vote tally, timeline, actions
/create              → Form buat proposal baru
/delegate            → Delegate voting power
```

### Komponen kunci

```
components/
├── ProposalCard.tsx       → card proposal dengan status badge
├── VoteTally.tsx          → progress bar For/Against/Abstain
├── ProposalTimeline.tsx   → status timeline: Pending → Active → Queued → Executed
├── TreasuryBalance.tsx    → ETH balance display
├── VoteModal.tsx          → modal For/Against/Abstain + reason
├── CreateProposalForm.tsx → form targets + values + description
└── DelegatePanel.tsx      → delegate/undelegate voting power
```

### wagmi hooks yang dipakai

```typescript
// Baca proposal state
useReadContract({ abi: governorAbi, functionName: 'state', args: [proposalId] })

// Cast vote
useWriteContract({ abi: governorAbi, functionName: 'castVoteWithReason' })

// Treasury balance
useBalance({ address: vaultAddress })

// Voting power
useReadContract({ abi: tokenAbi, functionName: 'getVotes', args: [address] })
```

---

## 6. Environment Variables

### contracts/.env
```bash
PRIVATE_KEY=           # wallet deployer (tanpa 0x)
SEPOLIA_RPC_URL=       # dari Alchemy atau Infura
ETHERSCAN_API_KEY=     # untuk verifikasi kontrak
```

### backend/.env
```bash
DATABASE_URL=          # postgresql://user:pass@localhost:5432/zenithdao
SEPOLIA_RPC_URL=       # sama dengan contracts
ZENITH_TOKEN_ADDRESS=
ZENITH_GOVERNOR_ADDRESS=
ZENITH_VAULT_ADDRESS=
TIMELOCK_ADDRESS=
PORT=3001
```

### frontend/.env
```bash
VITE_ALCHEMY_ID=
VITE_GOVERNOR_ADDRESS=
VITE_TOKEN_ADDRESS=
VITE_VAULT_ADDRESS=
VITE_TIMELOCK_ADDRESS=
```

---



## 7. Contract Addresses (isi setelah deploy)

```
Network:        Ethereum Sepolia
ZenithToken:    0x972624D7e3FCAcedd6A247397cC5899F991b8cE8
TimelockCtrl:   0x4f29536a65C4194CD868a3bE7161A32A97D96097
ZenithGovernor: 0x3ec8d7D4EfE502597756d7F9EFe198C65f06De66
ZenithVault:    0xe66d01d6489734EeA04E1a03A57342fd9c7237C8
```

> Deployed + verified on Sepolia at block 11033919. All four contracts verified on Etherscan.

---

## 8. Referensi

| Resource | URL |
|---|---|
| OpenZeppelin Governor docs | https://docs.openzeppelin.com/contracts/5.x/governance |
| OpenZeppelin Governor wizard | https://wizard.openzeppelin.com/#governor |
| Foundry docs | https://book.getfoundry.sh |
| wagmi docs | https://wagmi.sh |
| Nouns DAO (referensi UI) | https://nouns.wtf |
| Tally (referensi UI) | https://tally.xyz |
| Compound governance (referensi kontrak) | https://compound.finance/governance |

---

---

*ZenithDAO - Govern without limits.*
