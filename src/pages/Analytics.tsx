import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import {
  usePriceIndicators,
  type PriceIndicator,
} from "@/hooks/useMarketData";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Activity,
  Zap,
  Globe2,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
type TimePeriod = (typeof TIME_PERIODS)[number];

const PERIOD_LIMITS: Record<TimePeriod, number> = {
  '1D': 24,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
};

// Symbols tracked on this page (must match price_indicators.symbol values).
const SYMBOL_LICO3 = 'LITHIUM_CARBONATE_BATTERY_GRADE';
const SYMBOL_LIOH = 'LITHIUM_HYDROXIDE';

// Regions surfaced in the regional comparison panel.
const REGIONS: { code: string; label: string; flag: string }[] = [
  { code: 'CN', label: 'China', flag: '🇨🇳' },
  { code: 'US', label: 'United States', flag: '🇺🇸' },
  { code: 'EU', label: 'Europe', flag: '🇪🇺' },
  { code: 'AU', label: 'Australia', flag: '🇦🇺' },
];

function latest(rows: PriceIndicator[]): PriceIndicator | undefined {
  // Rows arrive ordered by observed_at desc from the RPC.
  return rows[0];
}

/** Percent change between the most recent and the oldest observation in range. */
function changePercent(rows: PriceIndicator[]): number {
  if (rows.length < 2) return 0;
  const newest = rows[0].price;
  const oldest = rows[rows.length - 1].price;
  if (!oldest) return 0;
  return ((newest - oldest) / oldest) * 100;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Analytics() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('1M');
  const limit = PERIOD_LIMITS[activePeriod];

  // Real price history from the get_price_indicators RPC (with realtime).
  const lico3CnQuery = usePriceIndicators({ symbol: SYMBOL_LICO3, region: 'CN', limit });
  const liohCnQuery = usePriceIndicators({ symbol: SYMBOL_LIOH, region: 'CN', limit });
  // All regions for the comparison panel (latest carbonate price per region).
  // Pass region: null to fetch every region — an empty string would match no rows.
  const regionalQuery = usePriceIndicators({ symbol: SYMBOL_LICO3, region: null, limit: 200 });

  const isLoading =
    lico3CnQuery.isLoading || liohCnQuery.isLoading || regionalQuery.isLoading;
  const isError =
    lico3CnQuery.isError || liohCnQuery.isError || regionalQuery.isError;

  const lico3Rows = useMemo(() => lico3CnQuery.data ?? [], [lico3CnQuery.data]);
  const liohRows = useMemo(() => liohCnQuery.data ?? [], [liohCnQuery.data]);

  // Build chart series by aligning carbonate and hydroxide rows oldest -> newest.
  const chartData = useMemo(() => {
    const lico3 = [...lico3Rows].reverse();
    const lioh = [...liohRows].reverse();
    const length = Math.max(lico3.length, lioh.length);
    return Array.from({ length }, (_, i) => ({
      time: formatTime((lico3[i] ?? lioh[i])?.observed_at ?? new Date().toISOString()),
      LiCO3: lico3[i]?.price,
      LiOH: lioh[i]?.price,
    }));
  }, [lico3Rows, liohRows]);

  const regionalData = useMemo(() => {
    const rows = regionalQuery.data ?? [];
    return REGIONS.map((r) => {
      const forRegion = rows.filter((row) => row.region === r.code);
      const top = latest(forRegion);
      return {
        region: r.label,
        flag: r.flag,
        price: top?.price ?? null,
        trend: changePercent(forRegion),
      };
    }).filter((r) => r.price !== null) as {
      region: string;
      flag: string;
      price: number;
      trend: number;
    }[];
  }, [regionalQuery.data]);

  const spotPrices = useMemo(() => {
    const buildSpot = (
      commodity: string,
      unitLabel: string,
      rows: PriceIndicator[]
    ) => {
      const top = latest(rows);
      const prices = rows.map((r) => r.price);
      return {
        commodity,
        spotPrice: top?.price ?? 0,
        changePercent: changePercent(rows),
        unit: unitLabel,
        observedAt: top?.observed_at ?? null,
        high: prices.length ? Math.max(...prices) : 0,
        low: prices.length ? Math.min(...prices) : 0,
      };
    };
    return [
      buildSpot('Lithium Carbonate (Li₂CO₃)', 'MT', lico3Rows),
      buildSpot('Lithium Hydroxide (LiOH)', 'MT', liohRows),
    ];
  }, [lico3Rows, liohRows]);

  const hasData = chartData.length > 0 || spotPrices.some((s) => s.spotPrice > 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading market data...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />
        <div className="card-premium p-8 flex flex-col items-center justify-center text-center gap-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-semibold">Unable to load market data</p>
          <p className="text-sm text-muted-foreground">
            There was a problem fetching price indicators. Please try again.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              lico3CnQuery.refetch();
              liohCnQuery.refetch();
              regionalQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />
        <div className="card-premium p-8 flex flex-col items-center justify-center text-center gap-3">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">No price data available yet</p>
          <p className="text-sm text-muted-foreground">
            Price indicators will appear here as soon as market data is published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />

        {/* Spot Price Indicators */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Spot Price Indicators
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {spotPrices.map((indicator) => (
              <div key={indicator.commodity} className="card-premium p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{indicator.commodity}</h3>
                    <p className="text-xs text-muted-foreground">
                      Updated:{' '}
                      {indicator.observedAt
                        ? new Date(indicator.observedAt).toLocaleString()
                        : '—'}
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
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground">Period High</p>
                    <p className="font-mono font-medium text-success">${indicator.high.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Period Low</p>
                    <p className="font-mono font-medium text-destructive">${indicator.low.toLocaleString()}</p>
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
            value="$2.4B"
            change={8.5}
            changeLabel="vs last month"
            icon={Globe}
            variant="primary"
          />
          <KpiCard
            title="Active Suppliers"
            value="89"
            change={12}
            changeLabel="new this quarter"
            icon={Zap}
            variant="success"
          />
          <KpiCard
            title="Avg. Transaction Size"
            value="$4.2M"
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                />
                <Area
                  type="monotone"
                  dataKey="LiOH"
                  name="LiOH"
                  stroke="hsl(var(--accent))"
                  fill="url(#gradLiOH)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Price Heatmap */}
        <div className="card-premium p-6">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <Globe2 className="h-5 w-5 text-primary" />
            Regional Price Comparison (Li₂CO₃ USD/MT)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regionalData.map((r) => (
              <div key={r.region} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.flag}</span>
                  <div>
                    <p className="text-sm font-semibold">{r.region}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      Li₂CO₃ Spot
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">${r.price.toLocaleString()}</p>
                  <p className={`text-xs font-mono ${r.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {r.trend >= 0 ? '+' : ''}{r.trend.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
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
      </div>
    </>
  );
}
