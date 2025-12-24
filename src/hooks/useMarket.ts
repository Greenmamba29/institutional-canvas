/**
 * Market React Query Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { getPriceIndicators } from '@/services/market.service';

export const marketKeys = {
  prices: (symbol: string, region: string) => ['market', 'prices', symbol, region] as const,
};

export function usePriceIndicators(symbol: string, region: string, limit = 50) {
  return useQuery({
    queryKey: marketKeys.prices(symbol, region),
    queryFn: async () => {
      const { data, error } = await getPriceIndicators({
        p_symbol: symbol,
        p_region: region,
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!symbol && !!region,
  });
}
