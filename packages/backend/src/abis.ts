// Minimal human-readable ABIs — only the events + view functions the indexer
// and the REST API need. Matches the OpenZeppelin Governor / ZenithVault / ERC20Votes
// surfaces deployed on Sepolia.

export const governorAbi = [
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
  'event VoteCastWithParams(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason, bytes params)',
  'event ProposalQueued(uint256 proposalId, uint256 eta)',
  'event ProposalExecuted(uint256 proposalId)',
  'event ProposalCanceled(uint256 proposalId)',
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function quorum(uint256 blockNumber) view returns (uint256)',
] as const;

export const vaultAbi = [
  'event ETHReceived(address indexed sender, uint256 amount)',
  'event ETHExecuted(address indexed target, uint256 amount)',
  'event ERC20Executed(address indexed token, address indexed to, uint256 amount)',
  'function getETHBalance() view returns (uint256)',
] as const;

export const tokenAbi = [
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 blockNumber) view returns (uint256)',
  'function delegates(address account) view returns (address)',
  'function balanceOf(address account) view returns (uint256)',
] as const;
