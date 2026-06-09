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
      // Fetch verified suppliers count
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .not('verification_tier', 'is', null);

      // Fetch verified buyers (organizations with buyer type)
      const { count: buyersCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('org_type', 'buyer')
        .eq('status', 'active');

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
