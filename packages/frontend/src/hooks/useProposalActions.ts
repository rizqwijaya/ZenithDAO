import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { keccak256, parseAbiItem, toBytes, type Address, type Hex } from 'viem';
import { GOVERNOR_ADDRESS } from '../config/contracts';

const PROPOSAL_CREATED = parseAbiItem(
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
);

export interface ProposalActions {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
  description: string;
  descriptionHash: Hex;
}

/**
 * Recovers the original proposal actions (targets/values/calldatas) from the
 * on-chain ProposalCreated event so Queue / Execute can be re-submitted.
 * Searches a tight window around the proposal's snapshot block.
 */
export function useProposalActions(proposalId?: string, startBlock?: number | null) {
  const client = usePublicClient();
  return useQuery({
    queryKey: ['proposal-actions', proposalId],
    enabled: Boolean(client && proposalId && GOVERNOR_ADDRESS && startBlock),
    staleTime: Infinity,
    queryFn: async (): Promise<ProposalActions | null> => {
      if (!client || !GOVERNOR_ADDRESS || !proposalId || !startBlock) return null;
      const fromBlock = BigInt(Math.max(startBlock - 8, 0));
      const toBlock = BigInt(startBlock + 2);
      const logs = await client.getLogs({
        address: GOVERNOR_ADDRESS,
        event: PROPOSAL_CREATED,
        fromBlock,
        toBlock,
      });
      const match = logs.find((l) => l.args.proposalId?.toString() === proposalId);
      if (!match?.args) return null;
      const { targets, values, calldatas, description } = match.args;
      if (!targets || !values || !calldatas || description === undefined) return null;
      return {
        targets: targets as Address[],
        values: values as bigint[],
        calldatas: calldatas as Hex[],
        description,
        descriptionHash: keccak256(toBytes(description)),
      };
    },
  });
}
