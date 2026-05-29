import { useArbitrage, formatCurrency, formatPercent, useMarketAccess } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Clock, Zap, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

export function ArbitragePanel() {
  const { data: opportunities, isLoading } = useArbitrage();
  const { hasPriceAccess, isTeaser } = useMarketAccess();

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

  if (isTeaser) {
    return (
      <div className="glass-panel rounded-xl p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold">Arbitrage Opportunities</h3>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-success/20 text-success rounded">3 Active</span>
        </div>
        <div className="space-y-2 select-none blur-sm pointer-events-none">
          {[1, 2].map(i => (
            <div key={i} className="p-3 bg-secondary/30 rounded-lg border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Li Carbonate 99.5%</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-success/20 text-success rounded">+8.3% margin</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <div className="flex-1">
                  <p className="text-muted-foreground">Buy: China</p>
                  <p className="font-mono font-semibold">$12,100</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 text-right">
                  <p className="text-muted-foreground">Sell: Europe</p>
                  <p className="font-mono font-semibold text-success">$13,110</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
          <Lock className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-xs font-semibold mb-1">Pro required for arbitrage data</p>
          <p className="text-[10px] text-muted-foreground mb-3 text-center px-4">
            Live cross-regional pricing spreads updated via Airtable
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
