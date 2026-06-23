/**
 * ProcurementIntelligence — Pro+ page
 *
 * Sections:
 *  1. KPI strip (5 cards)
 *  2. Spend breakdown + funnel (2-col)
 *  3. Supplier leaderboard
 *  4. Price alert manager (enterprise gated)
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Paywall } from '@/components/shared/Paywall';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendBreakdownChart } from '@/components/procurement/SpendBreakdownChart';
import { ProcurementFunnel } from '@/components/procurement/ProcurementFunnel';
import { SupplierLeaderboard } from '@/components/procurement/SupplierLeaderboard';
import { PriceAlertManager } from '@/components/procurement/PriceAlertManager';
import { useProcurementKPIs } from '@/hooks/useProcurementKPIs';
import { useHasFeature } from '@/hooks/useSubscription';
import {
  BarChart3,
  DollarSign,
  FileText,
  TrendingUp,
  Users2,
  Percent,
  Bell,
} from 'lucide-react';

export default function ProcurementIntelligence() {
  const hasPro = useHasFeature('market_intelligence');
  const hasEnterprise = useHasFeature('chain_of_custody');
  const kpis = useProcurementKPIs();

  if (!hasPro) {
    return (
      <Paywall
        feature="Procurement Intelligence"
        description="Live market analysis, spend tracking, and supplier performance — all in one view."
        requiredTier="pro"
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Procurement Intelligence"
        description="Live market analysis, spend tracking, and supplier performance"
        icon={BarChart3}
      />

      {/* Section 1 — KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Spend"
          value={kpis.totalSpend > 0 ? `$${(kpis.totalSpend / 1000).toFixed(0)}k` : '$0'}
          change={kpis.spendGrowthPct}
          changeLabel="vs last month"
          icon={DollarSign}
          variant="primary"
        />
        <KpiCard
          title="Active RFQs"
          value={kpis.activeRFQs}
          icon={FileText}
          variant="default"
        />
        <KpiCard
          title="Deal Conversion"
          value={`${kpis.dealConversionRate}%`}
          icon={Percent}
          variant="success"
        />
        <KpiCard
          title="Avg Bids / RFQ"
          value={kpis.avgBidsPerRFQ}
          icon={Users2}
          variant="default"
        />
        <KpiCard
          title="Savings vs Market"
          value={`${kpis.savingsVsMarket}%`}
          icon={TrendingUp}
          variant={kpis.savingsVsMarket >= 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Section 2 — Spend + Funnel */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Spend breakdown — 60% */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Spend Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendBreakdownChart />
          </CardContent>
        </Card>

        {/* Procurement funnel — 40% */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Procurement Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProcurementFunnel />
          </CardContent>
        </Card>
      </div>

      {/* Section 3 — Supplier Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users2 className="h-4 w-4 text-primary" />
            Top Suppliers by Deal Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierLeaderboard />
        </CardContent>
      </Card>

      {/* Section 4 — Price Alerts (enterprise gate) */}
      {hasEnterprise ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PriceAlertManager />
          </CardContent>
        </Card>
      ) : (
        <Paywall
          feature="Price Alerts"
          description="Get notified when commodity prices cross your thresholds."
          requiredTier="enterprise"
          className="min-h-0"
        />
      )}
    </div>
  );
}
