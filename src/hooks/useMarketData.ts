/**
 * Market Intelligence Hook with Supabase Realtime
 * Provides live prices, KPIs, news, and arbitrage opportunities
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface KPIData {
  avg_lithium_price: number;
  total_suppliers: number;
  total_buyers: number;
  active_auctions: number;
  pending_rfqs: number;
  arbitrage_count: number;
  price_change_24h: number;
}

export interface PriceData {
  id: string;
  product_type: string;
  purity: string;
  region: string;
  price_usd: number;
  price_change_24h: number;
  market_trend: 'up' | 'down' | 'stable';
  confidence_score: number;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number;
  category: string;
  published_at: string;
}

export interface ArbitrageOpportunity {
  id: string;
  product_type: string;
  purity: string;
  buy_region: string;
  sell_region: string;
  buy_price: number;
  sell_price: number;
  profit_margin_percent: number;
  confidence_score: number;
  status: 'active' | 'expired' | 'executed';
  expires_at: string;
  detected_at: string;
}

export interface MarketDataState {
  kpis: KPIData | undefined;
  prices: PriceData[];
  news: NewsItem[];
  arbitrage: ArbitrageOpportunity[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

// ============================================================================
// FETCH FUNCTIONS
// ============================================================================

async function fetchKPIs(): Promise<KPIData> {
  const { data, error } = await (supabase as ReturnType<typeof import('@supabase/supabase-js').createClient>)
    .from('market_kpis')
    .select('metric_name, metric_value');

  if (error) throw error;

  const kpis: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data as any[])?.forEach((row: { metric_name: string; metric_value: number }) => {
    kpis[row.metric_name] = Number(row.metric_value);
  });

  return kpis as unknown as KPIData;
}

async function fetchPrices(): Promise<PriceData[]> {
  const { data, error } = await (supabase as ReturnType<typeof import('@supabase/supabase-js').createClient>)
    .from('market_prices')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as PriceData[];
}

async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await (supabase as ReturnType<typeof import('@supabase/supabase-js').createClient>)
    .from('market_news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data || []) as NewsItem[];
}

async function fetchArbitrage(): Promise<ArbitrageOpportunity[]> {
  const { data, error } = await (supabase as ReturnType<typeof import('@supabase/supabase-js').createClient>)
    .from('arbitrage_opportunities')
    .select('*')
    .eq('status', 'active')
    .order('profit_margin_percent', { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data || []) as ArbitrageOpportunity[];
}

// ============================================================================
// INDIVIDUAL HOOKS WITH REALTIME
// ============================================================================

export function useKPIs() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'kpis'],
    queryFn: fetchKPIs,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('market-kpis-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_kpis' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['market', 'kpis'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function usePrices() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'prices'],
    queryFn: fetchPrices,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('market-prices-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'market_prices' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['market', 'prices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useNews() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'news'],
    queryFn: fetchNews,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('market-news-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'market_news' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['market', 'news'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useArbitrage() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['market', 'arbitrage'],
    queryFn: fetchArbitrage,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('market-arbitrage-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arbitrage_opportunities' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['market', 'arbitrage'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

// ============================================================================
// COMBINED HOOK
// ============================================================================

export function useMarketData(): MarketDataState {
  const kpisQuery = useKPIs();
  const pricesQuery = usePrices();
  const newsQuery = useNews();
  const arbitrageQuery = useArbitrage();

  const isLoading = kpisQuery.isLoading || pricesQuery.isLoading;
  const isError = kpisQuery.isError || pricesQuery.isError || newsQuery.isError || arbitrageQuery.isError;
  const error = kpisQuery.error || pricesQuery.error || newsQuery.error || arbitrageQuery.error;

  const lastUpdated = pricesQuery.dataUpdatedAt ? new Date(pricesQuery.dataUpdatedAt) : null;

  return {
    kpis: kpisQuery.data,
    prices: pricesQuery.data || [],
    news: newsQuery.data || [],
    arbitrage: arbitrageQuery.data || [],
    isLoading,
    isError,
    error: error as Error | null,
    lastUpdated,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'text-success bg-success/10';
    case 'negative': return 'text-destructive bg-destructive/10';
    default: return 'text-muted-foreground bg-muted';
  }
}

export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return 'text-success';
    case 'down': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
}

export default useMarketData;
