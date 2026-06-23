import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { useMarketData, usePrices, useKPIs } from "@/hooks/useMarketData";
import { useRFQs } from "@/hooks/useRFQs";
import { useProcurementKPIs } from "@/hooks/useProcurementKPIs";
import { BidComparisonTable } from "@/components/procurement/BidComparisonTable";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Activity,
  Zap,
  Globe2,
  ShieldCheck,
  Package,
  Percent,
  Users2,
  DollarSign,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const TIME_PERIODS = ['1D', '1W', '1M', '3M', '1Y'] as const;
type TimePeriod = typeof TIME_PERIODS[number];

const TABS = ['Market', 'Regional', 'Procurement'] as const;
type Tab = typeof TABS[number];

// Map period to hours/days lookback
const PERIOD_LOOKBACK_DAYS: Record<TimePeriod, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

function formatPriceLabel(dateStr: string, period: TimePeriod): string {
  const d = new Date(dateStr);
  if (period === '1D') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (period === '1W') return d.toLocaleDateString([], { weekday: 'short' });
  if (period === '1M') return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
}

export default function Analytics() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('1M');
  const [activeTab, setActiveTab] = useState<Tab>('Market');

  const { isLoading: marketLoading } = useMarketData();
  const { data: prices = [], isLoading: pricesLoading } = usePrices();
  const { data: kpis } = useKPIs();
  const { data: rfqs = [] } = useRFQs();
  const procKpis = useProcurementKPIs();

  // Find most recent active RFQ for bid comparison
  const activeRfq = rfqs.find(r => r.status === 'submitted' || r.status === 'open');

  // Build price chart data from real prices, filtered by period
  const priceChartData = useMemo(() => {
    const lookbackMs = PERIOD_LOOKBACK_DAYS[activePeriod] * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - lookbackMs;

    const filtered = prices.filter(p => {
      const t = new Date(p.updated_at ?? p.created_at ?? '').getTime();
      return t >= cutoff;
    });

    // Group by time label, pick LiCO3 and LiOH separately
    const byTime: Record<string, { LiCO3?: number; LiOH?: number }> = {};
    for (const p of filtered) {
      const label = formatPriceLabel(p.updated_at ?? '', activePeriod);
      if (!byTime[label]) byTime[label] = {};
      if (p.product_type?.toLowerCase().includes('carbonate')) {
        byTime[label].LiCO3 = p.price_usd;
      } else if (p.product_type?.toLowerCase().includes('hydroxide')) {
        byTime[label].LiOH = p.price_usd;
      }
    }

    const entries = Object.entries(byTime).map(([time, vals]) => ({ time, ...vals }));

    // If no real data, show the most recent prices as a single data point
    if (entries.length === 0 && prices.length > 0) {
      const co3 = prices.find(p => p.product_type?.toLowerCase().includes('carbonate'));
      const oh = prices.find(p => p.product_type?.toLowerCase().includes('hydroxide'));
      return [{
        time: 'Now',
        LiCO3: co3?.price_usd,
        LiOH: oh?.price_usd,
      }];
    }

    return entries;
  }, [prices, activePeriod]);

  // Spot price indicators from real prices
  const co3Price = prices.find(p => p.product_type?.toLowerCase().includes('carbonate'));
  const ohPrice = prices.find(p => p.product_type?.toLowerCase().includes('hydroxide'));

  const spotPrices = [
    {
      commodity: 'Lithium Carbonate (Li₂CO₃)',
      spotPrice: co3Price?.price_usd ?? 13400,
      changePercent: co3Price?.price_change_24h ?? 2.8,
      volume24h: 1240,
      high52w: 22000,
      low52w: 10200,
      unit: 'MT',
    },
    {
      commodity: 'Lithium Hydroxide (LiOH)',
      spotPrice: ohPrice?.price_usd ?? 14600,
      changePercent: ohPrice?.price_change_24h ?? -1.2,
      volume24h: 890,
      high52w: 24500,
      low52w: 11800,
      unit: 'MT',
    },
  ];

  // Build regional data from market KPIs (supplemented with fallback)
  const regionalData = prices.length > 0
    ? prices.slice(0, 5).map(p => ({
        region: p.region,
        price: p.price_usd,
        supply: p.confidence_score != null
          ? p.confidence_score > 0.7 ? 'High' : p.confidence_score > 0.4 ? 'Medium' : 'Low'
          : 'Medium',
        trend: p.price_change_24h ?? 0,
        flag: '',
      }))
    : [
        { region: 'China', price: 11200, supply: 'High', trend: -2.1, flag: '🇨🇳' },
        { region: 'South America', price: 13800, supply: 'Medium', trend: 3.4, flag: '🌎' },
        { region: 'Australia', price: 14200, supply: 'Medium', trend: 1.8, flag: '🇦🇺' },
        { region: 'Europe', price: 15100, supply: 'Low', trend: 5.2, flag: '🇪🇺' },
        { region: 'North America', price: 14800, supply: 'Low', trend: 4.1, flag: '🇺🇸' },
      ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ===================== MARKET TAB ===================== */}
        {activeTab === 'Market' && (
          <>
            {/* Spot Price Indicators */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Spot Price Indicators
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {pricesLoading
                  ? [0, 1].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)
                  : spotPrices.map((indicator) => (
                    <div key={indicator.commodity} className="card-premium p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{indicator.commodity}</h3>
                          <p className="text-xs text-muted-foreground">
                            Updated: {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          indicator.changePercent >= 0
                            ? 'bg-success/10 text-success'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {indicator.changePercent >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-mono text-sm font-medium">
                            {indicator.changePercent >= 0 ? '+' : ''}{indicator.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-3xl font-bold font-mono tabular-nums text-gradient-primary">
                          ${indicator.spotPrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">per {indicator.unit}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <p className="text-xs text-muted-foreground">24h Volume</p>
                          <p className="font-mono font-medium">{indicator.volume24h.toLocaleString()} {indicator.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">52w High</p>
                          <p className="font-mono font-medium text-success">${indicator.high52w.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">52w Low</p>
                          <p className="font-mono font-medium text-destructive">${indicator.low52w.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid lg:grid-cols-3 gap-4">
              <KpiCard
                title="Global Material Volume"
                value={kpis?.total_suppliers != null ? `${kpis.total_suppliers} Suppliers` : '$2.4B'}
                change={8.5}
                changeLabel="vs last month"
                icon={Globe}
                variant="primary"
              />
              <KpiCard
                title="Active Suppliers"
                value={kpis?.total_suppliers ?? 89}
                change={12}
                changeLabel="new this quarter"
                icon={Zap}
                variant="success"
              />
              <KpiCard
                title="Avg. Lithium Price"
                value={kpis?.avg_lithium_price != null ? `$${kpis.avg_lithium_price.toLocaleString()}` : '$4.2M'}
                change={-2.3}
                changeLabel="vs last month"
                icon={BarChart3}
              />
            </div>

            {/* Price Trend Chart */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Price Trend Analysis (USD/MT)
                </h3>
                <div className="flex items-center gap-1">
                  {TIME_PERIODS.map((period) => (
                    <button
                      key={period}
                      onClick={() => setActivePeriod(period)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                        activePeriod === period
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-64">
                {pricesLoading ? (
                  <Skeleton className="h-full w-full rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceChartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradLiCO3" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradLiOH" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke="hsl(var(--muted-foreground))"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}/MT`, '']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="LiCO3"
                        name="Li₂CO₃"
                        stroke="hsl(var(--primary))"
                        fill="url(#gradLiCO3)"
                        strokeWidth={2}
                        connectNulls
                      />
                      <Area
                        type="monotone"
                        dataKey="LiOH"
                        name="LiOH"
                        stroke="hsl(var(--accent))"
                        fill="url(#gradLiOH)"
                        strokeWidth={2}
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Supplier Trust Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Supplier Trust Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Ganfeng Lithium', score: 97, deliveries: 142, verified: true },
                    { name: 'Albemarle Corp', score: 94, deliveries: 89, verified: true },
                    { name: 'SQM Chile', score: 91, deliveries: 67, verified: true },
                    { name: 'Livent Corp', score: 88, deliveries: 45, verified: false },
                  ].map((s) => (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.deliveries} on-time deliveries</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.verified && <Badge variant="outline" className="text-[10px] border-success text-success">Verified</Badge>}
                        <div className="text-right">
                          <p className="text-sm font-bold">{s.score}/100</p>
                          <div className="w-16 h-1.5 bg-secondary rounded-full mt-1">
                            <div className="h-1.5 bg-success rounded-full" style={{ width: `${s.score}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ===================== REGIONAL TAB ===================== */}
        {activeTab === 'Regional' && (
          <div className="card-premium p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Globe2 className="h-5 w-5 text-primary" />
              Regional Price Comparison (Li₂CO₃ USD/MT)
            </h3>
            {marketLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {regionalData.map((r) => (
                  <div key={r.region} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-2">
                      {r.flag && <span className="text-xl">{r.flag}</span>}
                      <div>
                        <p className="text-sm font-semibold">{r.region}</p>
                        <Badge
                          variant={r.supply === 'High' ? 'default' : r.supply === 'Medium' ? 'secondary' : 'destructive'}
                          className="text-[10px]"
                        >
                          {r.supply} Supply
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold">${r.price.toLocaleString()}</p>
                      <p className={`text-xs font-mono ${r.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {r.trend >= 0 ? '+' : ''}{typeof r.trend === 'number' ? r.trend.toFixed(1) : r.trend}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== PROCUREMENT TAB ===================== */}
        {activeTab === 'Procurement' && (
          <div className="space-y-6">
            {/* Procurement KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <KpiCard
                title="Total Spend"
                value={procKpis.totalSpend > 0 ? `$${(procKpis.totalSpend / 1000).toFixed(0)}k` : '$0'}
                change={procKpis.spendGrowthPct}
                changeLabel="vs last month"
                icon={DollarSign}
                variant="primary"
              />
              <KpiCard
                title="Active RFQs"
                value={procKpis.activeRFQs}
                icon={FileText}
              />
              <KpiCard
                title="Deal Conversion"
                value={`${procKpis.dealConversionRate}%`}
                icon={Percent}
                variant="success"
              />
              <KpiCard
                title="Avg Bids / RFQ"
                value={procKpis.avgBidsPerRFQ}
                icon={Users2}
              />
              <KpiCard
                title="Savings vs Market"
                value={`${procKpis.savingsVsMarket}%`}
                icon={TrendingUp}
                variant={procKpis.savingsVsMarket >= 0 ? 'success' : 'warning'}
              />
            </div>

            {/* Avg time to award */}
            {procKpis.avgTimeToAward > 0 && (
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-secondary/30">
                <Activity className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Average time to award</p>
                  <p className="text-2xl font-bold font-mono">{procKpis.avgTimeToAward} days</p>
                </div>
                {procKpis.topSupplierName !== '—' && (
                  <>
                    <div className="w-px h-10 bg-border" />
                    <div>
                      <p className="text-sm text-muted-foreground">Top supplier</p>
                      <p className="text-base font-semibold font-mono">{procKpis.topSupplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        ${procKpis.topSupplierSpend.toLocaleString()} total
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Most recent active RFQ bid comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Bid Comparison — Most Recent Active RFQ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeRfq ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-4">
                      RFQ: <span className="font-semibold">{activeRfq.title}</span>
                    </p>
                    <BidComparisonTable rfqId={activeRfq.id} />
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No active RFQs found. Submit an RFQ to see bid comparisons.
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={() => window.location.href = '/rfqs'}>
                        Go to RFQs
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
