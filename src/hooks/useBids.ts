/**
 * Bids React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 * All mutations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { listBids, getBidsByRfq, submitBid, withdrawBid, type Bid } from '@/services/bids.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { SubmitBidInput } from '@/lib/validation/schemas';
import { toast } from 'sonner';

export const bidKeys = {
  all: ['bids'] as const,
  list: (orgId: string | null) => ['bids', 'list', orgId] as const,
  byRfq: (rfqId: string) => ['bids', 'rfq', rfqId] as const,
};

export function useBids() {
  const { currentOrgId } = useCurrentOrg();
  
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'bids',
    event: '*',
    queryKey: bidKeys.list(currentOrgId),
    enabled: !!currentOrgId,
  });

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
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: SubmitBidInput) => {
      const client = await getClient();
      const { data, error } = await submitBid(client, params);
      if (error) throw error;
      return data as Bid;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bidKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: bidKeys.byRfq(variables.p_rfq_id) });
      toast.success('Bid submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit bid');
    },
  });
}

export function useWithdrawBid() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (bidId: string) => {
      const client = await getClient();
      const { data, error } = await withdrawBid(client, bidId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bidKeys.list(currentOrgId) });
      toast.success('Bid withdrawn successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to withdraw bid');
    },
  });
}
