/**
 * Supplier Leaderboard Hook
 *
 * Ranks suppliers by total deal value, win rate, and response rate.
 * Joins bids + deals + suppliers tables.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface SupplierLeaderboardEntry {
  supplier_id: string;
  name: string;
  country: string;
  total_deals: number;
  total_value_usd: number;
  win_rate_pct: number;
  avg_price: number;
  verified: boolean;
}

export function useSupplierLeaderboard() {
  const { currentOrgId } = useCurrentOrg();

  return useQuery({
    queryKey: ['supplier-leaderboard', currentOrgId],
    queryFn: async (): Promise<SupplierLeaderboardEntry[]> => {
      // Fetch bids and deals in parallel
      const [bidsRes, dealsRes, suppliersRes] = await Promise.all([
        supabase.from('bids').select('id, supplier_id, price, quantity, rfq_id').eq('is_withdrawn', false),
        supabase.from('deals').select('id, supplier_id').eq('offer_decision', 'accepted'),
        supabase.from('suppliers').select('org_id, display_name, verification_tier, public_profile'),
      ]);

      const bids = bidsRes.data ?? [];
      const deals = dealsRes.data ?? [];
      const suppliers = suppliersRes.data ?? [];

      // Build lookup maps
      const supplierMeta: Record<string, { name: string; country: string; verified: boolean }> = {};
      for (const s of suppliers) {
        const profile = s.public_profile as Record<string, unknown> | null;
        supplierMeta[s.org_id] = {
          name: s.display_name ?? s.org_id.slice(0, 8),
          country: (profile?.country as string | undefined) ?? '',
          verified: s.verification_tier === 'verified' || s.verification_tier === 'premium',
        };
      }

      // Group bids by supplier
      const bidsBySupplier: Record<string, typeof bids> = {};
      for (const bid of bids) {
        if (!bidsBySupplier[bid.supplier_id]) bidsBySupplier[bid.supplier_id] = [];
        bidsBySupplier[bid.supplier_id].push(bid);
      }

      // Count deals per supplier
      const dealCountBySupplier: Record<string, number> = {};
      for (const deal of deals) {
        dealCountBySupplier[deal.supplier_id] = (dealCountBySupplier[deal.supplier_id] ?? 0) + 1;
      }

      // Build leaderboard entries
      const allSupplierIds = [...new Set([
        ...Object.keys(bidsBySupplier),
        ...Object.keys(dealCountBySupplier),
      ])];

      const entries: SupplierLeaderboardEntry[] = allSupplierIds.map(sid => {
        const supplierBids = bidsBySupplier[sid] ?? [];
        const totalDeals = dealCountBySupplier[sid] ?? 0;
        const totalBids = supplierBids.length;
        const winRate = totalBids > 0 ? parseFloat(((totalDeals / totalBids) * 100).toFixed(1)) : 0;
        const totalValue = supplierBids.reduce((sum, b) => sum + (b.price ?? 0) * (b.quantity ?? 1), 0);
        const avgPrice = totalBids > 0
          ? parseFloat((supplierBids.reduce((s, b) => s + (b.price ?? 0), 0) / totalBids).toFixed(2))
          : 0;
        const meta = supplierMeta[sid] ?? { name: sid.slice(0, 8), country: '', verified: false };

        return {
          supplier_id: sid,
          name: meta.name,
          country: meta.country,
          total_deals: totalDeals,
          total_value_usd: totalValue,
          win_rate_pct: winRate,
          avg_price: avgPrice,
          verified: meta.verified,
        };
      });

      return entries.sort((a, b) => b.total_value_usd - a.total_value_usd);
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000,
  });
}
