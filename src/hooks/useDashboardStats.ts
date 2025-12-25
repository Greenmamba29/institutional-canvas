/**
 * Dashboard Stats Hook
 * 
 * Aggregates org-level statistics from various data sources
 */

import { useQuery } from '@tanstack/react-query';
import { useRFQs } from './useRFQs';
import { useBids } from './useBids';
import { useDeals } from './useDeals';
import { getPriceIndicators } from '@/services/market.service';

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
    acceptedDeals: deals.filter(d => d.status === 'accepted').length,
    pendingDeals: deals.filter(d => d.status === 'pending' || d.status === 'awarded').length,
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

/**
 * Hook to fetch price ticker data
 */
export function usePriceTicker() {
  return useQuery({
    queryKey: ['price-ticker'],
    queryFn: async () => {
      const { data, error } = await getPriceIndicators({
        p_symbol: 'LCE',
        p_region: 'GLOBAL',
        p_limit: 1,
      });
      
      if (error) throw error;
      return data?.[0] || null;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
