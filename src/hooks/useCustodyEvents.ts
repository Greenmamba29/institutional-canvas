/**
 * Chain of Custody React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getCustodyChains, 
  getCustodyChainById, 
  getCustodyChainByOrderId,
  getCustodyChainByDealId,
  addCustodyEvent,
  type CustodyChain,
  type CustodyEvent 
} from '@/services/custody.service';

export const custodyKeys = {
  all: ['custody'] as const,
  chains: () => [...custodyKeys.all, 'chains'] as const,
  chain: (id: string) => [...custodyKeys.all, 'chain', id] as const,
  byOrder: (orderId: string) => [...custodyKeys.all, 'order', orderId] as const,
  byDeal: (dealId: string) => [...custodyKeys.all, 'deal', dealId] as const,
};

/**
 * Get all custody chains for the current organization
 */
export function useCustodyChains() {
  return useQuery({
    queryKey: custodyKeys.chains(),
    queryFn: async () => {
      const { data, error } = await getCustodyChains();
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Get a specific custody chain by ID
 */
export function useCustodyChain(chainId: string | undefined) {
  return useQuery({
    queryKey: custodyKeys.chain(chainId ?? ''),
    queryFn: async () => {
      if (!chainId) return null;
      const { data, error } = await getCustodyChainById(chainId);
      if (error) throw error;
      return data;
    },
    enabled: !!chainId,
  });
}

/**
 * Get custody chain by order ID
 */
export function useCustodyByOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: custodyKeys.byOrder(orderId ?? ''),
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await getCustodyChainByOrderId(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

/**
 * Get custody chain by deal ID
 */
export function useCustodyByDeal(dealId: string | undefined) {
  return useQuery({
    queryKey: custodyKeys.byDeal(dealId ?? ''),
    queryFn: async () => {
      if (!dealId) return null;
      const { data, error } = await getCustodyChainByDealId(dealId);
      if (error) throw error;
      return data;
    },
    enabled: !!dealId,
  });
}

/**
 * Add a new custody event to a chain
 */
export function useAddCustodyEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ chainId, event }: { chainId: string; event: Omit<CustodyEvent, 'id'> }) => {
      const { data, error } = await addCustodyEvent(chainId, event);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { chainId }) => {
      queryClient.invalidateQueries({ queryKey: custodyKeys.chain(chainId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.chains() });
    },
  });
}
