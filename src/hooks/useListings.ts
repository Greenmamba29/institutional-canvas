/**
 * Listings React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { listListings, getListing } from '@/services/listings.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const listingKeys = {
  all: ['listings'] as const,
  detail: (id: string) => ['listings', id] as const,
};

export function useListings() {
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'products',
    event: '*',
    queryKey: listingKeys.all,
  });

  return useQuery({
    queryKey: listingKeys.all,
    queryFn: async () => {
      const { data, error } = await listListings();
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useListing(productId: string) {
  return useQuery({
    queryKey: listingKeys.detail(productId),
    queryFn: async () => {
      const { data, error } = await getListing(productId);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}
