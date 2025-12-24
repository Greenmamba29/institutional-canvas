/**
 * Deals React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listDeals, getDealById, createDeal, updateDealStatus, respondToOffer } from '@/services/deals.service';

export const dealKeys = {
  all: ['deals'] as const,
  detail: (id: string) => ['deals', id] as const,
};

export function useDeals() {
  return useQuery({
    queryKey: dealKeys.all,
    queryFn: async () => {
      const { data, error } = await listDeals();
      if (error) throw error;
      return data ?? [];
    },
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
  
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDealStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}

export function useRespondToOffer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: respondToOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}
