/**
 * Dashboard Stats Hook
 * 
 * Aggregates org-level statistics from various data sources
 * Now uses real-time market data from Make.com integration
 */

import { useRFQs } from './useRFQs';
import { useBids } from './useBids';
import { useDeals } from './useDeals';
import { usePrices } from './useMarketData';

export interface DashboardStats {
  // RFQ Stats
  totalRfqs: number;
  activeRfqs: number;
  submittedRfqs: number;
  
  // Bid Stats
  totalBids: number;
  activeBids: number;
  
  // Deal Stats
  totalDeals: number;
  acceptedDeals: number;
  pendingDeals: number;
  totalDealValue: number;
  
  // Activity
  recentActivity: Array<{
    id: string;
    type: 'rfq' | 'bid' | 'deal';
    title: string;
    timestamp: string;
    status: string;
  }>;
}

export function useDashboardStats() {
  const { data: rfqs = [], isLoading: rfqsLoading } = useRFQs();
  const { data: bids = [], isLoading: bidsLoading } = useBids();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();

  const isLoading = rfqsLoading || bidsLoading || dealsLoading;

  // Compute stats from loaded data
  const stats: DashboardStats = {
    // RFQ Stats
    totalRfqs: rfqs.length,
    activeRfqs: rfqs.filter(r => r.status === 'submitted').length,
    submittedRfqs: rfqs.filter(r => r.status === 'submitted').length,
    
    // Bid Stats
    totalBids: bids.length,
    activeBids: bids.filter(b => !b.is_withdrawn).length,
    
    // Deal Stats
    totalDeals: deals.length,
    acceptedDeals: deals.filter(d => d.offer_decision === 'accepted').length,
    pendingDeals: deals.filter(d => d.status === 'pending' || d.status === 'active').length,
    totalDealValue: 0, // Would need to calculate from bid prices
    
    // Recent Activity (last 10 items across all types)
    recentActivity: [
      ...rfqs.slice(0, 3).map(rfq => ({
        id: rfq.id,
        type: 'rfq' as const,
        title: rfq.title,
        timestamp: rfq.created_at,
        status: rfq.status,
      })),
      ...bids.slice(0, 3).map(bid => ({
        id: bid.id,
        type: 'bid' as const,
        title: `Bid on RFQ`,
        timestamp: bid.created_at,
        status: bid.is_withdrawn ? 'withdrawn' : 'active',
      })),
      ...deals.slice(0, 4).map(deal => ({
        id: deal.id,
        type: 'deal' as const,
        title: deal.title,
        timestamp: deal.created_at,
        status: deal.status,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10),
  };

  return {
    data: stats,
    isLoading,
  };
}

export interface PriceTickerData {
  symbol: string;
  region: string;
  price: number;
  unit: string;
  change24h: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Hook to fetch price ticker data from real-time market_prices table
 */
export function usePriceTicker() {
  const { data: prices, isLoading } = usePrices();
  
  // Get the first/most recent price as the ticker
  const tickerData: PriceTickerData | null = prices?.[0] ? {
    symbol: prices[0].product_type,
    region: prices[0].region,
    price: prices[0].price_usd,
    unit: 'MT',
    change24h: prices[0].price_change_24h,
    trend: prices[0].market_trend,
  } : null;

  return {
    data: tickerData,
    isLoading,
  };
}
