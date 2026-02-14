/**
 * Market Intelligence React Query Hook
 * Live Perplexity-powered market data with subscription gating
 *
 * Uses queryMarketIntel service to call the perplexity-market-intel Edge Function.
 * Subscription tier is injected automatically from useSubscriptionTier.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryMarketIntel, type MarketIntelResponse } from '@/services/market-intel.service';
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier';
import { toast } from 'sonner';

export const marketIntelKeys = {
  all: ['market-intel'] as const,
  query: (category: string, query: string) => ['market-intel', category, query] as const,
};

/**
 * Declarative query hook - fetches market intel for a given query/category
 */
export function useMarketIntelQuery(
  query: string,
  category: 'price' | 'news' | 'auction' | 'company',
  options?: { enabled?: boolean }
) {
  const tier = useSubscriptionTier();

  return useQuery<MarketIntelResponse>({
    queryKey: marketIntelKeys.query(category, query),
    queryFn: () => queryMarketIntel(query, category, tier),
    enabled: options?.enabled !== false && !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Imperative mutation hook - trigger market intel queries on demand
 */
export function useMarketIntelMutation() {
  const queryClient = useQueryClient();
  const tier = useSubscriptionTier();

  return useMutation({
    mutationFn: ({ query, category }: { query: string; category: 'price' | 'news' | 'auction' | 'company' }) =>
      queryMarketIntel(query, category, tier),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: marketIntelKeys.query(variables.category, variables.query) });
      toast.success('Market intelligence updated');
    },
    onError: (error: Error) => {
      if (error.message.includes('403') || error.message.includes('upgrade')) {
        toast.error('Upgrade to Pro to access this feature');
      } else {
        toast.error(error.message || 'Failed to fetch market intelligence');
      }
    },
  });
}
