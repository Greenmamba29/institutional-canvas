import { useArbitrage, formatCurrency, formatPercent } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ArbitragePanel() {
  const { data: opportunities, isLoading } = useArbitrage();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="space-y-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Arbitrage Opportunities</h3>
        </div>
        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-success/20 text-success rounded">
          {opportunities?.length || 0} Active
        </span>
      </div>

      <div className="space-y-2">
        {opportunities?.slice(0, 3).map((opp) => (
          <div
            key={opp.id}
            className="p-3 bg-secondary/30 rounded-lg border border-border/30 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">{opp.product_type}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-success/20 text-success rounded">
                {formatPercent(opp.profit_margin_percent)} margin
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex-1">
                <p className="text-muted-foreground">Buy: {opp.buy_region}</p>
                <p className="font-mono font-semibold">{formatCurrency(opp.buy_price)}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 text-right">
                <p className="text-muted-foreground">Sell: {opp.sell_region}</p>
                <p className="font-mono font-semibold text-success">{formatCurrency(opp.sell_price)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(opp.expires_at) > new Date()
                  ? `Expires ${formatDistanceToNow(new Date(opp.expires_at), { addSuffix: true })}`
                  : 'Expired'}
              </span>
              {new Date(opp.expires_at) <= new Date() && (
                <span className="ml-1 px-1 py-0.5 text-[9px] bg-muted rounded">DEMO</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {opportunities && opportunities.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No active arbitrage opportunities</p>
      )}
    </div>
  );
}
