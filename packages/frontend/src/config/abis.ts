import { parseAbi } from 'viem';

// Only the surface the dApp touches. Full ABIs live in the compiled artifacts.
export const governorAbi = parseAbi([
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalThreshold() view returns (uint256)',
  'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
  'function proposalSnapshot(uint256 proposalId) view returns (uint256)',
  'function proposalDeadline(uint256 proposalId) view returns (uint256)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
  'function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) payable returns (uint256)',
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
]);

export const tokenAbi = parseAbi([
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function delegates(address account) view returns (address)',
  'function delegate(address delegatee)',
  'function balanceOf(address account) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function symbol() view returns (string)',
]);

export const vaultAbi = parseAbi([
  'function getETHBalance() view returns (uint256)',
  'function executeETH(address target, uint256 amount)',
  'function executeERC20(address token, address to, uint256 amount)',
]);

export const faucetAbi = parseAbi([
  'function amountPerClaim() view returns (uint256)',
  'function cooldown() view returns (uint256)',
  'function lastClaim(address account) view returns (uint256)',
  'function canClaim(address account) view returns (bool)',
  'function secondsUntilNextClaim(address account) view returns (uint256)',
  'function claim()',
]);
