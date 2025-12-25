/**
 * Bids React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { listBids, getBidsByRfq, submitBid, withdrawBid } from '@/services/bids.service';

export const bidKeys = {
  all: ['bids'] as const,
  list: (orgId: string | null) => ['bids', 'list', orgId] as const,
  byRfq: (rfqId: string) => ['bids', 'rfq', rfqId] as const,
};

export function useBids() {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: bidKeys.list(currentOrgId),
    queryFn: async () => {
      const { data, error } = await listBids();
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useBidsByRfq(rfqId: string) {
  return useQuery({
    queryKey: bidKeys.byRfq(rfqId),
    queryFn: async () => {
      const { data, error } = await getBidsByRfq(rfqId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!rfqId,
  });
}

export function useSubmitBid() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: submitBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.list(currentOrgId) });
    },
  });
}

export function useWithdrawBid() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: withdrawBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.list(currentOrgId) });
    },
  });
}
