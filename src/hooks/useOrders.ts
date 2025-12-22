/**
 * React Query hooks for Orders and Quotes
 * Mutations will invalidate queries automatically
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrders,
  getOrderById,
  getQuotes,
  getQuoteById,
  createOrder,
  updateOrderStatus,
} from '@/services/orders.service';
import { toast } from 'sonner';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...quoteKeys.lists(), filters] as const,
  details: () => [...quoteKeys.all, 'detail'] as const,
  detail: (id: string) => [...quoteKeys.details(), id] as const,
};

// ============================================
// ORDER QUERIES
// ============================================

export function useOrders(options?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: orderKeys.list(options ?? {}),
    queryFn: async () => {
      const { data, error } = await getOrders(options);
      if (error) throw error;
      return data;
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const { data, error } = await getOrderById(orderId);
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

// ============================================
// ORDER MUTATIONS (pending backend RPC)
// ============================================

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success('Order created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// QUOTE QUERIES
// ============================================

export function useQuotes(options?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: quoteKeys.list(options ?? {}),
    queryFn: async () => {
      const { data, error } = await getQuotes(options);
      if (error) throw error;
      return data;
    },
  });
}

export function useQuote(quoteId: string) {
  return useQuery({
    queryKey: quoteKeys.detail(quoteId),
    queryFn: async () => {
      const { data, error } = await getQuoteById(quoteId);
      if (error) throw error;
      return data;
    },
    enabled: !!quoteId,
  });
}
