/**
 * Bids React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBids, getBidsByRfq, submitBid, withdrawBid } from '@/services/bids.service';

export const bidKeys = {
  all: ['bids'] as const,
  byRfq: (rfqId: string) => ['bids', 'rfq', rfqId] as const,
};

export function useBids() {
  return useQuery({
    queryKey: bidKeys.all,
    queryFn: async () => {
      const { data, error } = await listBids();
      if (error) throw error;
      return data ?? [];
    },
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
  
  return useMutation({
    mutationFn: submitBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.all });
    },
  });
}

export function useWithdrawBid() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: withdrawBid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.all });
    },
  });
}
