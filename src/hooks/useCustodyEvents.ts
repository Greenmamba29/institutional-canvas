/**
 * Chain of Custody React Query Hooks
 *
 * Backed by the real order-scoped RPCs in custody.service.ts. The service
 * requires an authenticated Supabase client (org/RLS context), built here from
 * the current session token (same pattern as usePurchases / useRfqs).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client';
import {
  getCustodyChainById,
  getCustodyChainByOrderId,
  getCustodyEventsByOrder,
  addCustodyEvent,
  type CreateCustodyEventParams,
} from '@/services/custody.service';

export const custodyKeys = {
  all: ['custody'] as const,
  chains: () => [...custodyKeys.all, 'chains'] as const,
  chain: (id: string) => [...custodyKeys.all, 'chain', id] as const,
  byOrder: (orderId: string) => [...custodyKeys.all, 'order', orderId] as const,
  events: (orderId: string) => [...custodyKeys.all, 'events', orderId] as const,
};

/**
 * Get all custody chains for the current organization.
 *
 * There is no org-wide "list chains" RPC — chains are resolved per order via
 * get_chain_of_custody. This hook therefore returns an empty list (the page
 * renders its empty state); use useCustodyChain / useCustodyByOrder with a
 * known order id to load a specific chain.
 */
export function useCustodyChains() {
  return useQuery({
    queryKey: custodyKeys.chains(),
    queryFn: async () => [],
  });
}

/**
 * Get a specific custody chain by id (resolved as the order's chain).
 */
export function useCustodyChain(chainId: string | undefined) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: custodyKeys.chain(chainId ?? ''),
    queryFn: async () => {
      if (!chainId) return null;
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getCustodyChainById(client, chainId);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated && !!chainId,
  });
}

/**
 * Get custody chain by order ID.
 */
export function useCustodyByOrder(orderId: string | undefined) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: custodyKeys.byOrder(orderId ?? ''),
    queryFn: async () => {
      if (!orderId) return null;
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getCustodyChainByOrderId(client, orderId);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated && !!orderId,
  });
}

/**
 * Get the raw ordered custody events for an order.
 */
export function useCustodyEvents(orderId: string | undefined) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: custodyKeys.events(orderId ?? ''),
    queryFn: async () => {
      if (!orderId) return [];
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getCustodyEventsByOrder(client, orderId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAuthenticated && !!orderId,
  });
}

/**
 * Add a new custody event to an order's chain.
 */
export function useAddCustodyEvent() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCustodyEventParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await addCustodyEvent(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: custodyKeys.chain(params.orderId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.byOrder(params.orderId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.events(params.orderId) });
      queryClient.invalidateQueries({ queryKey: custodyKeys.chains() });
    },
  });
}
