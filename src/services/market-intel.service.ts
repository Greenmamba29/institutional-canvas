/**
 * Market Intelligence Service - Perplexity API powered live data
 * Connects to perplexity-market-intel Edge Function
 *
 * SECURITY: API keys are stored server-side in Edge Function secrets, not exposed to client
 */

import { supabase } from '@/integrations/supabase/client';

export interface MarketIntelResult {
  id: string;
  query: string;
  category: 'price' | 'news' | 'auction' | 'company';
  content: string;
  source: string;
  timestamp: string;
  cached: boolean;
}

export interface MarketIntelResponse {
  results: MarketIntelResult[];
  cached: boolean;
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
  raw_api_response?: unknown; // enterprise only
}

/**
 * Query the Perplexity-powered market intelligence Edge Function
 */
export async function queryMarketIntel(
  query: string,
  category: 'price' | 'news' | 'auction' | 'company',
  subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<MarketIntelResponse> {
  const { data, error } = await supabase.functions.invoke('perplexity-market-intel', {
    body: { query, category, subscription_tier: subscriptionTier },
  });

  if (error) {
    console.error('Market intel query failed:', error);
    throw new Error(error.message || 'Failed to fetch market intelligence');
  }

  return data as MarketIntelResponse;
}
