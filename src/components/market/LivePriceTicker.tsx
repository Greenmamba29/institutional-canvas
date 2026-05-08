import { usePrices, getTrendColor, formatCurrency, formatPercent, useMarketAccess } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEASER_ROWS = [
  { label: 'Li Carbonate 99.5%', region: 'China', change: '+2.1%' },
  { label: 'Li Hydroxide Mono.', region: 'Korea', change: '-0.8%' },
];

export function LivePriceTicker() {
  const { data: prices, isLoading } = usePrices();
  const { hasPriceAccess, isTeaser } = useMarketAccess();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isTeaser) {
    return (
      <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Live Market Prices</h3>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-accent/20 text-accent rounded">LIVE</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Via Airtable</span>
        </div>
        <div className="space-y-2 select-none">
          {TEASER_ROWS.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/20">
              <div className="flex-1">
                <p className="text-xs font-medium">{row.label}</p>
                <p className="text-[10px] text-muted-foreground">{row.region}</p>
              </div>
              <div className="text-right blur-sm pointer-events-none">
                <p className="text-sm font-bold font-mono">$12,345</p>
                <p className="text-[10px] font-medium text-success">{row.change}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
          <Lock className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-xs font-semibold mb-1">Pro required for live prices</p>
          <p className="text-[10px] text-muted-foreground mb-3 text-center px-4">
            Real-time lithium pricing updates via Airtable
          </p>
          <Button size="sm" className="h-7 text-xs" onClick={() => window.location.href = '/settings/billing?plan=pro'}>
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Live Market Prices</h3>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-accent/20 text-accent rounded animate-pulse">
            LIVE
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Via Airtable</span>
      </div>

      <div className="space-y-2">
        {prices?.slice(0, 5).map((price) => {
          const TrendIcon = price.market_trend === 'up' ? TrendingUp : price.market_trend === 'down' ? TrendingDown : Minus;
          return (
            <div
              key={price.id}
              className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
            >
              <div className="flex-1">
                <p className="text-xs font-medium">{price.product_type}</p>
                <p className="text-[10px] text-muted-foreground">{price.region} • {price.purity}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono">{formatCurrency(price.price_usd)}</p>
                <p className={`text-[10px] font-medium flex items-center justify-end gap-1 ${getTrendColor(price.market_trend)}`}>
                  <TrendIcon className="h-3 w-3" />
                  {formatPercent(price.price_change_24h)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {prices && prices.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No price data available</p>
      )}
    </div>
  );
}
