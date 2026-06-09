/**
 * GMV (Gross Merchandise Volume) Stats Hook
 *
 * Aggregates platform-wide GMV statistics from real paid orders.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GMVStats {
  gmvYTD: number;
  gmvPreviousYear: number;
  /** Year-over-year change vs. the same period last year. null when there is no prior-year baseline. */
  changePercent: number | null;
  suppliersVerified: number;
  buyersVerified: number;
  monthlyData: { month: string; value: number }[];
}

export function useGMVStats() {
  return useQuery({
    queryKey: ['gmv-stats'],
    queryFn: async (): Promise<GMVStats> => {
      // Verified-supplier and active-buyer counts come from market_kpis, the
      // public-read, Airtable-synced KPI store kept current by the
      // refresh_platform_kpis() function. Counting these directly from the
      // client is blocked by RLS (organizations is member-scoped), so this is
      // the canonical source. Trigger a refresh so the figures are fresh.
      await supabase.rpc('refresh_platform_kpis');

      const { data: kpiRows } = await supabase
        .from('market_kpis')
        .select('metric_name, metric_value')
        .in('metric_name', ['total_verified_suppliers', 'total_buyers']);

      // metric_value is a DECIMAL column → PostgREST returns it as a string.
      const kpi = (name: string): number | null => {
        const raw = kpiRows?.find((r) => r.metric_name === name)?.metric_value;
        const n = raw == null ? NaN : Number(raw);
        return Number.isFinite(n) ? n : null;
      };
      const suppliersCount = kpi('total_verified_suppliers');
      const buyersCount = kpi('total_buyers');

      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);

      // Fetch paid orders from the start of last year onwards — real transaction value.
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', prevYearStart.toISOString());

      const paidOrders = (orders ?? []).filter(
        (o): o is { total_amount: number; created_at: string } =>
          o.created_at != null && typeof o.total_amount === 'number'
      );

      // GMV year-to-date: sum of paid order amounts this calendar year.
      const gmvYTD = paidOrders
        .filter((o) => new Date(o.created_at) >= yearStart)
        .reduce((sum, o) => sum + o.total_amount, 0);

      // Prior-year baseline over the same elapsed window (Jan 1 → today, last year).
      const prevPeriodEnd = new Date(prevYearStart);
      prevPeriodEnd.setFullYear(prevPeriodEnd.getFullYear(), now.getMonth(), now.getDate());
      const gmvPreviousYear = paidOrders
        .filter((o) => {
          const d = new Date(o.created_at);
          return d >= prevYearStart && d < yearStart && d <= prevPeriodEnd;
        })
        .reduce((sum, o) => sum + o.total_amount, 0);

      const changePercent =
        gmvPreviousYear > 0
          ? ((gmvYTD - gmvPreviousYear) / gmvPreviousYear) * 100
          : null;

      // Monthly sparkline: real paid-order totals per month, this calendar year.
      const monthlyTotals = new Array(12).fill(0);
      for (const o of paidOrders) {
        const d = new Date(o.created_at);
        if (d >= yearStart) {
          monthlyTotals[d.getMonth()] += o.total_amount;
        }
      }
      const monthlyData = monthlyTotals.map((value, i) => ({
        month: new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
        value,
      }));

      return {
        gmvYTD,
        gmvPreviousYear,
        changePercent,
        suppliersVerified: suppliersCount ?? 0,
        buyersVerified: buyersCount ?? 0,
        monthlyData,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get sparkline data for GMV chart.
 * Returns an empty array when there is no real monthly order data, so the
 * sparkline hides itself rather than rendering fabricated values.
 */
export function useGMVSparkline() {
  const { data: gmvStats } = useGMVStats();
  return gmvStats?.monthlyData.map((d) => d.value) ?? [];
}
