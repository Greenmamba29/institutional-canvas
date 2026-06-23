/**
 * Spend Analytics Hook
 *
 * Computes spend analytics from real deals + purchases data.
 * Returns monthly spend trends, category breakdown, and supplier breakdown.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface MonthlySpend {
  month: string;
  spend_usd: number;
  order_count: number;
}

export interface SpendByCategory {
  category: string;
  spend_usd: number;
  pct: number;
}

export interface SpendBySupplier {
  supplier_id: string;
  name: string;
  spend_usd: number;
  pct: number;
}

export interface SpendAnalytics {
  monthlySpend: MonthlySpend[];
  spendByCategory: SpendByCategory[];
  spendBySupplier: SpendBySupplier[];
  totalSpend: number;
  isLoading: boolean;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('default', { month: 'short', year: '2-digit' });
}

export function useSpendAnalytics(): SpendAnalytics {
  const { currentOrgId } = useCurrentOrg();

  const { data, isLoading } = useQuery({
    queryKey: ['spend-analytics', currentOrgId],
    queryFn: async () => {
      // Query purchases table for spend data (most reliable spend record)
      const { data: purchases, error: purchasesErr } = await supabase
        .from('purchases')
        .select('*')
        .order('created_at', { ascending: true });

      if (purchasesErr) throw purchasesErr;

      // Also query deals accepted to derive category spend
      const { data: deals, error: dealsErr } = await supabase
        .from('deals')
        .select('*')
        .eq('offer_decision', 'accepted');

      if (dealsErr) throw dealsErr;

      return { purchases: purchases ?? [], deals: deals ?? [] };
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const purchases = data?.purchases ?? [];

  // --- Monthly Spend ---
  const monthMap: Record<string, { spend_usd: number; order_count: number }> = {};
  for (const p of purchases) {
    const month = formatMonth(p.created_at);
    if (!monthMap[month]) monthMap[month] = { spend_usd: 0, order_count: 0 };
    monthMap[month].spend_usd += p.total_amount ?? 0;
    monthMap[month].order_count += 1;
  }
  const monthlySpend: MonthlySpend[] = Object.entries(monthMap).map(([month, v]) => ({
    month,
    ...v,
  }));

  // --- Total Spend ---
  const totalSpend = purchases.reduce((sum, p) => sum + (p.total_amount ?? 0), 0);

  // --- Spend by Category (derive from funding_source or commodity grouping) ---
  const categoryMap: Record<string, number> = {};
  for (const p of purchases) {
    const cat = (p.funding_source as string | null) ?? 'Other';
    categoryMap[cat] = (categoryMap[cat] ?? 0) + (p.total_amount ?? 0);
  }
  const spendByCategory: SpendByCategory[] = Object.entries(categoryMap).map(([category, spend_usd]) => ({
    category,
    spend_usd,
    pct: totalSpend > 0 ? Math.round((spend_usd / totalSpend) * 100) : 0,
  })).sort((a, b) => b.spend_usd - a.spend_usd);

  // --- Spend by Supplier ---
  const supplierMap: Record<string, number> = {};
  for (const p of purchases) {
    const sid = p.supplier_org_id ?? 'unknown';
    supplierMap[sid] = (supplierMap[sid] ?? 0) + (p.total_amount ?? 0);
  }
  const spendBySupplier: SpendBySupplier[] = Object.entries(supplierMap).map(([supplier_id, spend_usd]) => ({
    supplier_id,
    name: supplier_id === 'unknown' ? 'Unknown Supplier' : supplier_id.slice(0, 8),
    spend_usd,
    pct: totalSpend > 0 ? Math.round((spend_usd / totalSpend) * 100) : 0,
  })).sort((a, b) => b.spend_usd - a.spend_usd);

  return { monthlySpend, spendByCategory, spendBySupplier, totalSpend, isLoading };
}

export function useMonthlySpend() {
  const { monthlySpend, isLoading } = useSpendAnalytics();
  return { data: monthlySpend, isLoading };
}

export function useSpendBySupplier() {
  const { spendBySupplier, isLoading } = useSpendAnalytics();
  return { data: spendBySupplier, isLoading };
}
