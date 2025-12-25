/**
 * Deals React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { listDeals, getDealById, createDeal, updateDealStatus, respondToOffer } from '@/services/deals.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const dealKeys = {
  all: ['deals'] as const,
  list: (orgId: string | null) => ['deals', 'list', orgId] as const,
  detail: (id: string) => ['deals', id] as const,
};

export function useDeals() {
  const { currentOrgId } = useCurrentOrg();
  
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'deals',
    event: '*',
    queryKey: dealKeys.list(currentOrgId),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: dealKeys.list(currentOrgId),
    queryFn: async () => {
      const { data, error } = await listDeals();
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useDeal(dealId: string) {
  return useQuery({
    queryKey: dealKeys.detail(dealId),
    queryFn: async () => {
      const { data, error } = await getDealById(dealId);
      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
    },
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: updateDealStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
    },
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: respondToOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
    },
  });
}
