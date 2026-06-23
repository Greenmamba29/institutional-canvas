/**
 * Bid Comparison Hook
 *
 * For a given rfq_id, fetches all bids and computes comparison metrics.
 * Returns bids sorted by price ASC, best_bid_id, price_spread_pct, avg_price, savings_vs_worst.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Bid = Tables<'bids'>;

export interface BidWithRank extends Bid {
  rank: number;
  savings_vs_worst: number;
  supplier_name: string;
}

export interface BidComparisonResult {
  bids: BidWithRank[];
  best_bid_id: string | null;
  price_spread_pct: number;
  avg_price: number;
  savings_vs_worst: number;
  isLoading: boolean;
}

export function useBidComparison(rfqId: string): BidComparisonResult {
  const { data, isLoading } = useQuery({
    queryKey: ['bid-comparison', rfqId],
    queryFn: async () => {
      const { data: bids, error } = await supabase
        .from('bids')
        .select('*')
        .eq('rfq_id', rfqId)
        .eq('is_withdrawn', false)
        .order('price', { ascending: true });

      if (error) throw error;

      // Fetch supplier display names
      const supplierIds = [...new Set((bids ?? []).map(b => b.supplier_id))];
      let supplierNames: Record<string, string> = {};
      if (supplierIds.length > 0) {
        const { data: suppliers } = await supabase
          .from('suppliers')
          .select('org_id, display_name')
          .in('org_id', supplierIds);
        (suppliers ?? []).forEach(s => {
          supplierNames[s.org_id] = s.display_name ?? s.org_id.slice(0, 8);
        });
      }

      return { bids: bids ?? [], supplierNames };
    },
    enabled: !!rfqId,
    staleTime: 2 * 60 * 1000,
  });

  const rawBids = data?.bids ?? [];
  const supplierNames = data?.supplierNames ?? {};

  if (rawBids.length === 0) {
    return {
      bids: [],
      best_bid_id: null,
      price_spread_pct: 0,
      avg_price: 0,
      savings_vs_worst: 0,
      isLoading,
    };
  }

  const prices = rawBids.map(b => b.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const spreadPct = maxPrice > 0 ? ((maxPrice - minPrice) / maxPrice) * 100 : 0;

  const bidsWithRank: BidWithRank[] = rawBids.map((bid, idx) => ({
    ...bid,
    rank: idx + 1,
    savings_vs_worst: maxPrice - bid.price,
    supplier_name: supplierNames[bid.supplier_id] ?? `Supplier ${idx + 1}`,
  }));

  return {
    bids: bidsWithRank,
    best_bid_id: rawBids[0]?.id ?? null,
    price_spread_pct: parseFloat(spreadPct.toFixed(1)),
    avg_price: parseFloat(avgPrice.toFixed(2)),
    savings_vs_worst: maxPrice - minPrice,
    isLoading,
  };
}
