import { usePrices, getTrendColor, getTrendIcon, formatCurrency, formatPercent } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function LivePriceTicker() {
  const { data: prices, isLoading } = usePrices();

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

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Live Market Prices</h3>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-accent/20 text-accent rounded animate-pulse">
            LIVE
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Via Make.com/Perplexity</span>
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
