
import { PageHeader } from "@/components/shared/PageHeader";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { KpiCard } from "@/components/shared/KpiCard";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Activity,
  Zap,
  Clock
} from "lucide-react";
import { priceIndicators } from "@/data/mockData";

export default function Analytics() {
  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Analytics"
          description="Global market intelligence and price indicators for primary and secondary lithium"
          icon={TrendingUp}
        />

        {/* Price Indicators */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Spot Price Indicators
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {priceIndicators.map((indicator) => (
              <div key={indicator.commodity} className="card-premium p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{indicator.commodity}</h3>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(indicator.lastUpdated).toLocaleTimeString()}
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

        {/* Market Overview */}
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

        {/* Chart Placeholder */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Price Trend Analysis
            </h3>
            <div className="flex items-center gap-2">
              {['1D', '1W', '1M', '3M', '1Y'].map((period) => (
                <button
                  key={period}
                  className="px-3 py-1 text-sm rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg bg-secondary/20">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-muted-foreground">TODO: Implement price charts with Recharts</p>
              <p className="text-xs text-muted-foreground mt-1">Historical data visualization coming in Phase 2</p>
            </div>
          </div>
        </div>

        {/* Market Heatmap Placeholder */}
        <div className="card-premium p-6 border-dashed border-2 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold">Phase 2: Market Heatmap</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            TODO: Regional price comparison, supply/demand indicators, and supplier distribution map.
          </p>
        </div>

        {/* Supplier Trust Scores Placeholder */}
        <div className="card-premium p-6 border-dashed border-2 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold">Phase 2: Supplier Trust Intelligence</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            TODO: Verification badges, trust scores, delivery reliability metrics, and quality ratings.
          </p>
        </div>
      </div>
    </>
  );
}
