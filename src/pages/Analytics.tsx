import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { useMarketData } from "@/hooks/useMarketData";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Activity,
  Zap,
  Globe2,
  ShieldCheck,
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

// Static historical price data for chart visualization
const priceHistory = {
  '1D': [
    { time: '09:00', LiCO3: 12800, LiOH: 14200 },
    { time: '10:00', LiCO3: 12950, LiOH: 14100 },
    { time: '11:00', LiCO3: 13100, LiOH: 14350 },
    { time: '12:00', LiCO3: 13050, LiOH: 14400 },
    { time: '13:00', LiCO3: 12900, LiOH: 14250 },
    { time: '14:00', LiCO3: 13200, LiOH: 14500 },
    { time: '15:00', LiCO3: 13350, LiOH: 14600 },
    { time: '16:00', LiCO3: 13400, LiOH: 14550 },
  ],
  '1W': [
    { time: 'Mon', LiCO3: 12600, LiOH: 13900 },
    { time: 'Tue', LiCO3: 12800, LiOH: 14100 },
    { time: 'Wed', LiCO3: 12750, LiOH: 14050 },
    { time: 'Thu', LiCO3: 13000, LiOH: 14300 },
    { time: 'Fri', LiCO3: 13200, LiOH: 14450 },
    { time: 'Sat', LiCO3: 13100, LiOH: 14400 },
    { time: 'Sun', LiCO3: 13400, LiOH: 14600 },
  ],
  '1M': [
    { time: 'Jan 20', LiCO3: 11800, LiOH: 13200 },
    { time: 'Jan 27', LiCO3: 12100, LiOH: 13500 },
    { time: 'Feb 3', LiCO3: 12400, LiOH: 13800 },
    { time: 'Feb 10', LiCO3: 12800, LiOH: 14100 },
    { time: 'Feb 17', LiCO3: 13400, LiOH: 14600 },
  ],
  '3M': [
    { time: 'Nov', LiCO3: 10500, LiOH: 12000 },
    { time: 'Dec', LiCO3: 11200, LiOH: 12800 },
    { time: 'Jan', LiCO3: 12400, LiOH: 13800 },
    { time: 'Feb', LiCO3: 13400, LiOH: 14600 },
  ],
  '1Y': [
    { time: 'Feb 25', LiCO3: 18000, LiOH: 20000 },
    { time: 'May 25', LiCO3: 16500, LiOH: 18500 },
    { time: 'Aug 25', LiCO3: 14800, LiOH: 16800 },
    { time: 'Nov 25', LiCO3: 12000, LiOH: 13500 },
    { time: 'Feb 26', LiCO3: 13400, LiOH: 14600 },
  ],
};

const regionalData = [
  { region: 'China', price: 11200, supply: 'High', trend: -2.1, flag: '🇨🇳' },
  { region: 'South America', price: 13800, supply: 'Medium', trend: +3.4, flag: '🌎' },
  { region: 'Australia', price: 14200, supply: 'Medium', trend: +1.8, flag: '🇦🇺' },
  { region: 'Europe', price: 15100, supply: 'Low', trend: +5.2, flag: '🇪🇺' },
  { region: 'North America', price: 14800, supply: 'Low', trend: +4.1, flag: '🇺🇸' },
];

export default function Analytics() {
  const [activePeriod, setActivePeriod] = useState<keyof typeof priceHistory>('1M');
  const { isLoading } = useMarketData();

  const spotPrices = [
    {
      commodity: 'Lithium Carbonate (Li₂CO₃)',
      spotPrice: 13400,
      changePercent: 2.8,
      volume24h: 1240,
      high52w: 22000,
      low52w: 10200,
      unit: 'MT',
    },
    {
      commodity: 'Lithium Hydroxide (LiOH)',
      spotPrice: 14600,
      changePercent: -1.2,
      volume24h: 890,
      high52w: 24500,
      low52w: 11800,
      unit: 'MT',
    },
  ];

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
              <AreaChart data={priceHistory[activePeriod]} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
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
                    <Badge variant={r.supply === 'High' ? 'default' : r.supply === 'Medium' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {r.supply} Supply
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">${r.price.toLocaleString()}</p>
                  <p className={`text-xs font-mono ${r.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {r.trend >= 0 ? '+' : ''}{r.trend}%
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
