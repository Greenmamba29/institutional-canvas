/**
 * Procurement KPIs Hook
 *
 * Aggregates top-level procurement performance metrics by combining
 * data from rfqs, bids, deals, purchases, and market_prices tables.
 */

import { useRFQs } from '@/hooks/useRFQs';
import { useBids } from '@/hooks/useBids';
import { useDeals } from '@/hooks/useDeals';
import { usePrices } from '@/hooks/useMarketData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface ProcurementKPIs {
  totalSpend: number;
  spendGrowthPct: number;
  activeRFQs: number;
  avgBidsPerRFQ: number;
  dealConversionRate: number;
  avgTimeToAward: number;
  topSupplierName: string;
  topSupplierSpend: number;
  savingsVsMarket: number;
  isLoading: boolean;
}

export function useProcurementKPIs(): ProcurementKPIs {
  const { currentOrgId } = useCurrentOrg();
  const { data: rfqs = [], isLoading: rfqsLoading } = useRFQs();
  const { data: bids = [], isLoading: bidsLoading } = useBids();
  const { data: deals = [], isLoading: dealsLoading } = useDeals();
  const { data: prices = [], isLoading: pricesLoading } = usePrices();

  // Fetch purchases for spend data
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['purchases-kpi', currentOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = rfqsLoading || bidsLoading || dealsLoading || pricesLoading || purchasesLoading;

  // --- Total Spend ---
  const totalSpend = purchases.reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

  // --- Spend Growth (current month vs prior month) ---
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentMonthSpend = purchases
    .filter(p => new Date(p.created_at) >= currentMonthStart)
    .reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

  const priorMonthSpend = purchases
    .filter(p => {
      const d = new Date(p.created_at);
      return d >= priorMonthStart && d < currentMonthStart;
    })
    .reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

  const spendGrowthPct = priorMonthSpend > 0
    ? ((currentMonthSpend - priorMonthSpend) / priorMonthSpend) * 100
    : 0;

  // --- Active RFQs ---
  const activeRFQs = rfqs.filter(r => r.status === 'submitted' || r.status === 'open').length;

  // --- Avg Bids per RFQ ---
  const activeBids = bids.filter(b => !b.is_withdrawn);
  const avgBidsPerRFQ = rfqs.length > 0
    ? parseFloat((activeBids.length / rfqs.length).toFixed(1))
    : 0;

  // --- Deal Conversion Rate ---
  const acceptedDeals = deals.filter(d => d.offer_decision === 'accepted');
  const dealConversionRate = rfqs.length > 0
    ? parseFloat(((acceptedDeals.length / rfqs.length) * 100).toFixed(1))
    : 0;

  // --- Avg Time to Award (deals: days from rfq created to deal created) ---
  // We approximate using deal created_at minus the associated rfq created_at
  let avgTimeToAward = 0;
  const dealsWithRfq = deals.filter(d => d.rfq_id);
  if (dealsWithRfq.length > 0) {
    const rfqMap = Object.fromEntries(rfqs.map(r => [r.id, r]));
    const durations = dealsWithRfq
      .map(d => {
        const rfq = rfqMap[d.rfq_id ?? ''];
        if (!rfq) return null;
        const diff = new Date(d.created_at).getTime() - new Date(rfq.created_at).getTime();
        return diff / (1000 * 60 * 60 * 24);
      })
      .filter((n): n is number => n !== null && n >= 0);

    avgTimeToAward = durations.length > 0
      ? parseFloat((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1))
      : 0;
  }

  // --- Top Supplier ---
  const supplierSpend: Record<string, number> = {};
  for (const p of purchases) {
    const sid = p.supplier_org_id ?? 'unknown';
    supplierSpend[sid] = (supplierSpend[sid] ?? 0) + (p.total_amount ?? 0);
  }
  const topEntry = Object.entries(supplierSpend).sort((a, b) => b[1] - a[1])[0];
  const topSupplierSpend = topEntry?.[1] ?? 0;
  const topSupplierName = topEntry ? topEntry[0].slice(0, 8) : '—';

  // --- Savings vs Market ---
  // Compare average deal bid price to average market price
  const avgMarketPrice = prices.length > 0
    ? prices.reduce((sum, p) => sum + p.price_usd, 0) / prices.length
    : 0;

  const activeBidPrices = activeBids.map(b => b.price);
  const avgDealPrice = activeBidPrices.length > 0
    ? activeBidPrices.reduce((a, b) => a + b, 0) / activeBidPrices.length
    : 0;

  const savingsVsMarket = avgMarketPrice > 0 && avgDealPrice > 0
    ? parseFloat(((avgMarketPrice - avgDealPrice) / avgMarketPrice * 100).toFixed(1))
    : 0;

  return {
    totalSpend,
    spendGrowthPct: parseFloat(spendGrowthPct.toFixed(1)),
    activeRFQs,
    avgBidsPerRFQ,
    dealConversionRate,
    avgTimeToAward,
    topSupplierName,
    topSupplierSpend,
    savingsVsMarket,
    isLoading,
  };
}
