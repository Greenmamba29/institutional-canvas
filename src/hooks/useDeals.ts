/**
 * Deals React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 * All mutations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { 
  listDeals, 
  getDealById, 
  createDeal, 
  updateDealStatus, 
  respondToOffer,
  type Deal,
  type DealStatus
} from '@/services/deals.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { CreateDealInput, RespondToOfferInput } from '@/lib/validation/schemas';
import { toast } from 'sonner';

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
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: CreateDealInput) => {
      const client = await getClient();
      const { data, error } = await createDeal(client, params);
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
      toast.success('Deal created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create deal');
    },
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: { p_deal_id: string; p_status: DealStatus }) => {
      const client = await getClient();
      const { data, error } = await updateDealStatus(client, params);
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.p_deal_id) });
      toast.success('Deal status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update deal status');
    },
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: RespondToOfferInput) => {
      const client = await getClient();
      const { data, error } = await respondToOffer(client, params);
      if (error) throw error;
      return data as Deal;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: dealKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: dealKeys.detail(variables.p_deal_id) });
      toast.success('Response submitted');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond to offer');
    },
  });
}
