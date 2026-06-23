/**
 * SupplierLeaderboard — ranked table of top suppliers by deal volume.
 */

import { useSupplierLeaderboard } from '@/hooks/useSupplierLeaderboard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MEDAL_CLASSES = [
  'bg-yellow-100 text-yellow-700 border-yellow-300',  // gold
  'bg-gray-100 text-gray-500 border-gray-300',         // silver
  'bg-orange-100 text-orange-600 border-orange-300',   // bronze
];

const FLAG_MAP: Record<string, string> = {
  CN: '🇨🇳', US: '🇺🇸', AU: '🇦🇺', CL: '🇨🇱', AR: '🇦🇷',
  DE: '🇩🇪', GB: '🇬🇧', JP: '🇯🇵', KR: '🇰🇷', CA: '🇨🇦',
};

export function SupplierLeaderboard() {
  const { data: suppliers = [], isLoading } = useSupplierLeaderboard();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No supplier data available yet.
      </div>
    );
  }

  const maxValue = suppliers[0]?.total_value_usd ?? 1;

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">Rank</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Supplier</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Deals</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total Spend</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground w-40">Win Rate</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Avg Price</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier, idx) => {
            const rank = idx + 1;
            const medalClass = MEDAL_CLASSES[idx] ?? '';
            const flag = FLAG_MAP[supplier.country?.toUpperCase() ?? ''] ?? '';
            const barPct = maxValue > 0 ? (supplier.total_value_usd / maxValue) * 100 : 0;

            return (
              <tr
                key={supplier.supplier_id}
                className={cn(
                  'border-b border-border/50 cursor-pointer transition-colors hover:bg-secondary/30',
                  rank <= 3 && 'hover:bg-primary/5'
                )}
                onClick={() => navigate(`/marketplace?supplier=${supplier.supplier_id}`)}
              >
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold',
                    rank <= 3 ? medalClass : 'bg-secondary text-muted-foreground border-border'
                  )}>
                    {rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {flag && <span className="text-base">{flag}</span>}
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.country && (
                        <p className="text-xs text-muted-foreground">{supplier.country}</p>
                      )}
                    </div>
                    {supplier.verified && (
                      <Badge variant="outline" className="text-[10px] border-success text-success ml-1">
                        <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono">{supplier.total_deals}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">
                  ${supplier.total_value_usd.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={barPct} className="h-2 flex-1" />
                    <span className="text-xs font-mono w-10 text-right text-muted-foreground">
                      {supplier.win_rate_pct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                  {supplier.avg_price > 0 ? `$${supplier.avg_price.toLocaleString()}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
