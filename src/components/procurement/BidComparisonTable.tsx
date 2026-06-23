/**
 * BidComparisonTable — renders all bids for a given RFQ side-by-side
 * with savings analysis.
 */

import { useBidComparison } from '@/hooks/useBidComparison';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BidComparisonTableProps {
  rfqId: string;
}

export function BidComparisonTable({ rfqId }: BidComparisonTableProps) {
  const { bids, best_bid_id, price_spread_pct, avg_price, savings_vs_worst, isLoading } =
    useBidComparison(rfqId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <TrendingDown className="mx-auto h-8 w-8 mb-2 opacity-40" />
        <p className="text-sm">No bids received for this RFQ yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{bids.length} bids received</span>
        <span>·</span>
        <span>
          Best price:{' '}
          <span className="font-mono font-semibold text-success">
            ${bids[0].price.toLocaleString()}/MT
          </span>
        </span>
        <span>·</span>
        <span>
          Spread:{' '}
          <span className="font-mono font-semibold">{price_spread_pct}%</span>
        </span>
        <span>·</span>
        <span>
          Avg:{' '}
          <span className="font-mono font-semibold">${avg_price.toLocaleString()}</span>
        </span>
        {savings_vs_worst > 0 && (
          <>
            <span>·</span>
            <span>
              Max savings vs highest:{' '}
              <span className="font-mono font-semibold text-success">
                ${savings_vs_worst.toLocaleString()}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price/MT</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Value</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Lead Time</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Terms</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Savings vs Highest</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {bids.map(bid => {
              const isBest = bid.id === best_bid_id;
              const totalValue = bid.price * (bid.quantity ?? 1);

              return (
                <tr
                  key={bid.id}
                  className={cn(
                    'border-b border-border/50 transition-colors hover:bg-secondary/30',
                    isBest && 'border-l-4 border-l-success bg-success/5'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                      isBest ? 'bg-success text-white' : 'bg-secondary text-muted-foreground'
                    )}>
                      {bid.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{bid.supplier_name}</span>
                      {isBest && (
                        <Badge variant="outline" className="text-[10px] border-success text-success">
                          Best
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    ${bid.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ${totalValue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {bid.lead_time_days != null ? `${bid.lead_time_days}d` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bid.currency ?? 'USD'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {bid.savings_vs_worst > 0 ? (
                      <span className="font-mono text-success">
                        ${bid.savings_vs_worst.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isBest && (
                      <Button size="sm" variant="outline" disabled className="gap-1 text-xs">
                        <Award className="h-3 w-3" />
                        Award Deal
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
