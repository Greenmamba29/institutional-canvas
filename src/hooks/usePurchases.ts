/**
 * Purchases Hooks
 * 
 * React Query hooks for purchase order management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client';
import {
  listPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  CreatePurchaseParams,
  UpdatePurchaseStatusParams,
} from '@/services/purchases.service';

/**
 * Fetch all purchases for the current user
 */
export function usePurchases() {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await listPurchases(client);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch a single purchase by PO number
 */
export function usePurchase(poNumber: string | undefined) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['purchase', poNumber],
    queryFn: async () => {
      if (!poNumber) return null;
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getPurchaseById(client, poNumber);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated && !!poNumber,
  });
}

/**
 * Create a new purchase order
 */
export function useCreatePurchase() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreatePurchaseParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await createPurchase(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });
}

/**
 * Update purchase status
 */
export function useUpdatePurchaseStatus() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdatePurchaseStatusParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await updatePurchaseStatus(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchase', variables.purchaseId] });
    },
  });
}
