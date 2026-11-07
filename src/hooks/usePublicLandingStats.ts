/**
 * Public landing-page stats.
 *
 * Every number shown on the public landing page must come from here, so that
 * each figure traces back to a real database row. Reads only public-read
 * tables (market_kpis, market_prices) and never triggers a KPI refresh.
 * A value is null when there is no real data for it; callers hide it.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LandingPrice {
  priceUsd: number;
  productType: string;
  source: string | null;
  updatedAt: string | null;
}

export interface PublicLandingStats {
  verifiedSuppliers: number | null;
  activeBuyers: number | null;
  gmvYtdUsd: number | null;
  carbonatePrice: LandingPrice | null;
}

const toPositiveNumber = (raw: unknown): number | null => {
  const n = raw == null ? NaN : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function fetchPublicLandingStats(): Promise<PublicLandingStats> {
  const [kpiRes, priceRes] = await Promise.all([
    supabase
      .from('market_kpis')
      .select('metric_name, metric_value')
      .in('metric_name', ['total_verified_suppliers', 'total_buyers', 'gmv_ytd']),
    supabase
      .from('market_prices')
      .select('product_type, purity, price_usd, source, updated_at')
      .ilike('product_type', '%carbonate%')
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  const kpi = (name: string) =>
    toPositiveNumber(kpiRes.data?.find((r) => r.metric_name === name)?.metric_value);

  // Prefer the most recent battery-grade carbonate quote; fall back to any carbonate quote.
  const prices = priceRes.data ?? [];
  const row =
    prices.find((p) => (p.purity ?? '').toLowerCase().includes('battery')) ?? prices[0];
  const priceUsd = toPositiveNumber(row?.price_usd);

  return {
    verifiedSuppliers: kpi('total_verified_suppliers'),
    activeBuyers: kpi('total_buyers'),
    gmvYtdUsd: kpi('gmv_ytd'),
    carbonatePrice:
      row && priceUsd != null
        ? {
            priceUsd,
            productType: row.product_type,
            source: row.source ?? null,
            updatedAt: row.updated_at ?? null,
          }
        : null,
  };
}

export function usePublicLandingStats() {
  return useQuery({
    queryKey: ['public-landing-stats'],
    queryFn: fetchPublicLandingStats,
    staleTime: 5 * 60 * 1000,
  });
}

/** Compact USD formatting for landing stats, e.g. 1_250_000 → "$1.3M". */
export function formatCompactUsd(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}
