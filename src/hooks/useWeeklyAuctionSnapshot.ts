/**
 * Weekly Auction Snapshot Hook
 *
 * Aggregates real auction activity for the WeeklyAuctionSnapshot widget from
 * the auctions and auction_bids tables. No values are fabricated: when there
 * is no activity the metrics resolve to zero / null and the widget renders an
 * empty state.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AuctionProductType = Database['public']['Enums']['auction_product_type'];

const OPEN_STATUSES = ['live', 'active', 'closing'] as const;

const PRODUCT_TYPE_LABELS: Record<AuctionProductType, string> = {
  lithium_carbonate: 'Carbonate',
  lithium_hydroxide: 'Hydroxide',
  spodumene: 'Spodumene',
  black_mass: 'Black Mass',
  recycled_material: 'Recycled',
};

export interface WeeklyAuctionSnapshotData {
  /** Total value of bids placed in the last 7 days (canonical USD). */
  totalBids: number;
  /** % change in bid volume vs. the prior 7-day window. null when no baseline. */
  changePercent: number | null;
  /** Number of currently open auction lots. */
  activeLots: number;
  /** Human-readable summary of the open lot product types. */
  lotType: string;
  /** Distinct bidders that placed bids in the last 7 days. */
  verifiedBidders: number;
}

export function useWeeklyAuctionSnapshot() {
  return useQuery({
    queryKey: ['weekly-auction-snapshot'],
    queryFn: async (): Promise<WeeklyAuctionSnapshotData> => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Bids placed over the trailing two weeks — real bid amounts.
      const { data: bids } = await supabase
        .from('auction_bids')
        .select('amount, bidder_id, created_at')
        .gte('created_at', twoWeeksAgo.toISOString());

      // Currently open auction lots and their product types.
      const { data: auctions } = await supabase
        .from('auctions')
        .select('product_type, status')
        .in('status', OPEN_STATUSES as unknown as string[]);

      const allBids = bids ?? [];
      const thisWeek = allBids.filter(
        (b) => b.created_at && new Date(b.created_at) >= weekAgo
      );
      const priorWeek = allBids.filter(
        (b) =>
          b.created_at &&
          new Date(b.created_at) >= twoWeeksAgo &&
          new Date(b.created_at) < weekAgo
      );

      const sum = (rows: typeof allBids) =>
        rows.reduce((acc, b) => acc + (typeof b.amount === 'number' ? b.amount : 0), 0);

      const totalBids = sum(thisWeek);
      const priorTotal = sum(priorWeek);
      const changePercent =
        priorTotal > 0 ? ((totalBids - priorTotal) / priorTotal) * 100 : null;

      const verifiedBidders = new Set(
        thisWeek.map((b) => b.bidder_id).filter((id): id is string => !!id)
      ).size;

      const openAuctions = auctions ?? [];
      const activeLots = openAuctions.length;

      const lotLabels = Array.from(
        new Set(
          openAuctions
            .map((a) => a.product_type)
            .filter((t): t is AuctionProductType => !!t)
            .map((t) => PRODUCT_TYPE_LABELS[t])
        )
      );
      const lotType = lotLabels.length > 0 ? lotLabels.join(' & ') : '';

      return {
        totalBids,
        changePercent,
        activeLots,
        lotType,
        verifiedBidders,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
