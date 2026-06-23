/**
 * RFQ Funnel Hook
 *
 * Computes the RFQ → Bid → Deal → Order conversion funnel.
 * Returns stages with counts/values and conversion rates between stages.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface FunnelStage {
  label: string;
  count: number;
  value_usd: number;
}

export interface RFQFunnelData {
  stages: FunnelStage[];
  conversionRates: {
    rfqToBid: number;
    bidToDeal: number;
    dealToOrder: number;
  };
  totalPipelineValue: number;
  isLoading: boolean;
}

export function useRFQFunnel(): RFQFunnelData {
  const { currentOrgId } = useCurrentOrg();

  const { data, isLoading } = useQuery({
    queryKey: ['rfq-funnel', currentOrgId],
    queryFn: async () => {
      const [rfqsRes, bidsRes, dealsRes, ordersRes] = await Promise.all([
        supabase.from('rfqs').select('id, target_quantity').order('created_at', { ascending: false }),
        supabase.from('bids').select('id, price, quantity, rfq_id').eq('is_withdrawn', false),
        supabase.from('deals').select('id, status').eq('offer_decision', 'accepted'),
        supabase.from('orders').select('id, total_amount'),
      ]);

      return {
        rfqs: rfqsRes.data ?? [],
        bids: bidsRes.data ?? [],
        deals: dealsRes.data ?? [],
        orders: ordersRes.data ?? [],
      };
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const rfqs = data?.rfqs ?? [];
  const bids = data?.bids ?? [];
  const deals = data?.deals ?? [];
  const orders = data?.orders ?? [];

  const bidsValue = bids.reduce((sum, b) => sum + (b.price ?? 0) * (b.quantity ?? 1), 0);
  const ordersValue = orders.reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  const stages: FunnelStage[] = [
    { label: 'RFQs', count: rfqs.length, value_usd: 0 },
    { label: 'Bids', count: bids.length, value_usd: bidsValue },
    { label: 'Deals', count: deals.length, value_usd: 0 },
    { label: 'Orders', count: orders.length, value_usd: ordersValue },
  ];

  const rfqToBid = rfqs.length > 0 ? parseFloat(((bids.length / rfqs.length) * 100).toFixed(1)) : 0;
  const bidToDeal = bids.length > 0 ? parseFloat(((deals.length / bids.length) * 100).toFixed(1)) : 0;
  const dealToOrder = deals.length > 0 ? parseFloat(((orders.length / deals.length) * 100).toFixed(1)) : 0;

  return {
    stages,
    conversionRates: { rfqToBid, bidToDeal, dealToOrder },
    totalPipelineValue: bidsValue + ordersValue,
    isLoading,
  };
}
