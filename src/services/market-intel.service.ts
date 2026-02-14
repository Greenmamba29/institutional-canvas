/**
 * Market Intelligence Service
 * Calls the perplexity-market-intel edge function for live lithium market data.
 */

import { supabase } from '@/integrations/supabase/client';

export type MarketIntelCategory = 'price' | 'supply' | 'demand' | 'regulatory' | 'technology';

export interface MarketIntelResult {
  category: MarketIntelCategory;
  content: string;
  citations: string[];
  cached_at: string;
}

export async function fetchMarketIntel(
  category: MarketIntelCategory = 'price',
  query?: string
): Promise<MarketIntelResult> {
  const { data, error } = await supabase.functions.invoke('perplexity-market-intel', {
    body: { category, query },
  });

  if (error) throw new Error(error.message || 'Failed to fetch market intelligence');
  if (data?.error) throw new Error(data.error);

  return data as MarketIntelResult;
}
