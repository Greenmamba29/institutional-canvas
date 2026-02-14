/**
 * Market Intelligence React Query Hook
 * Fetches live lithium market data via the Perplexity edge function.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchMarketIntel, type MarketIntelCategory, type MarketIntelResult } from '@/services/market-intel.service';
import { useSubscriptionTier } from '@/hooks/useSubscription';

export const marketIntelKeys = {
  all: ['market-intel'] as const,
  category: (cat: MarketIntelCategory) => ['market-intel', cat] as const,
};

export function useMarketIntel(category: MarketIntelCategory = 'price') {
  const tier = useSubscriptionTier();

  // Free tier: only price category, longer stale time
  const enabled = tier === 'free' ? category === 'price' : true;
  const staleTime = tier === 'free' ? 15 * 60 * 1000 : 2 * 60 * 1000;

  return useQuery<MarketIntelResult>({
    queryKey: marketIntelKeys.category(category),
    queryFn: () => fetchMarketIntel(category),
    enabled,
    staleTime,
    retry: 1,
  });
}
