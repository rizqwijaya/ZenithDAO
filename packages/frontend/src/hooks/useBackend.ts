import { useQuery } from '@tanstack/react-query';
import {
  apiGet,
  type ApiProposal,
  type ApiVote,
  type ApiTreasury,
  type ApiDelegate,
  type ApiHealth,
} from '../config/api';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<ApiHealth>('/health'),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useProposals(status?: string) {
  return useQuery({
    queryKey: ['proposals', status ?? 'all'],
    queryFn: () =>
      apiGet<ApiProposal[]>(status ? `/proposals?status=${encodeURIComponent(status)}` : '/proposals'),
    refetchInterval: 15_000,
  });
}

export function useProposal(id?: string) {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: () => apiGet<ApiProposal>(`/proposals/${id}`),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
}

export function useProposalVotes(id?: string) {
  return useQuery({
    queryKey: ['proposal-votes', id],
    queryFn: () => apiGet<ApiVote[]>(`/proposals/${id}/votes`),
    enabled: Boolean(id),
    refetchInterval: 15_000,
  });
}

export function useTreasury() {
  return useQuery({
    queryKey: ['treasury'],
    queryFn: () => apiGet<ApiTreasury>('/treasury'),
    refetchInterval: 20_000,
  });
}

export function useDelegateInfo(address?: string) {
  return useQuery({
    queryKey: ['delegate', address],
    queryFn: () => apiGet<ApiDelegate>(`/delegates/${address}`),
    enabled: Boolean(address),
  });
}
