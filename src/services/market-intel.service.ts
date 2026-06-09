/**
 * Market Intelligence Service
 *
 * Reads market intelligence (news) from the Supabase `market_news` table, which
 * is kept fresh by the `market-intel-ingest` edge function (Firecrawl-powered,
 * runs on a 30-min pg_cron schedule). This replaced the previous
 * `perplexity-market-intel` Edge Function — Perplexity has been decommissioned.
 *
 * The public API (queryMarketIntel + types) is unchanged so existing callers
 * (useMarketIntel hook, lb-market-pulse skill) keep working.
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
  raw_api_response?: unknown;
}

/**
 * Fetch recent market intelligence from the `market_news` table.
 * `category` is accepted for backwards compatibility; the table is news-based,
 * so results are the latest news items (optionally filtered by category).
 */
export async function queryMarketIntel(
  query: string,
  category: 'price' | 'news' | 'auction' | 'company' = 'news',
  _subscriptionTier: 'free' | 'pro' | 'enterprise' = 'free'
): Promise<MarketIntelResponse> {
  let q = supabase
    .from('market_news')
    .select('id, title, summary, source, url, category, published_at')
    .order('published_at', { ascending: false })
    .limit(12);

  // Best-effort category filter (news rows may use a different taxonomy).
  if (category && category !== 'news') {
    q = q.eq('category', category);
  }

  const { data, error } = await q;
  if (error) {
    console.error('Market intel query failed:', error);
    throw new Error(error.message || 'Failed to fetch market intelligence');
  }

  const results: MarketIntelResult[] = (data ?? []).map((row) => ({
    id: row.id as string,
    query,
    category: 'news',
    content: (row.summary as string) || (row.title as string) || '',
    source: (row.source as string) || (row.url as string) || 'market_news',
    timestamp: (row.published_at as string) || new Date().toISOString(),
    cached: true,
  }));

  return { results, cached: true };
}
