/**
 * ProcurementFunnel — horizontal RFQ→Bid→Deal→Order funnel visualization.
 */

import { useRFQFunnel } from '@/hooks/useRFQFunnel';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

export function ProcurementFunnel() {
  const { stages, conversionRates, totalPipelineValue, isLoading } = useRFQFunnel();

  const conversionLabels = [
    `${conversionRates.rfqToBid}% →`,
    `${conversionRates.bidToDeal}% →`,
    `${conversionRates.dealToOrder}% →`,
  ];

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Funnel stages */}
      <div className="flex items-stretch gap-1">
        {stages.map((stage, idx) => {
          const maxCount = Math.max(...stages.map(s => s.count), 1);
          const heightPct = stage.count > 0 ? Math.max((stage.count / maxCount) * 100, 20) : 20;

          return (
            <div key={stage.label} className="flex flex-1 flex-col items-center gap-2">
              {/* Bar */}
              <div className="flex flex-col items-center justify-end w-full" style={{ height: 120 }}>
                <div
                  className="w-full rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                  style={{
                    backgroundColor: STAGE_COLORS[idx],
                    height: `${heightPct}%`,
                    minHeight: 32,
                    opacity: stage.count === 0 ? 0.3 : 1,
                  }}
                >
                  <span className="text-white font-bold text-lg">
                    {stage.count}
                  </span>
                </div>
              </div>

              {/* Label */}
              <p className="text-xs font-semibold text-center">{stage.label}</p>

              {/* Value */}
              {stage.value_usd > 0 && (
                <p className="text-xs text-muted-foreground font-mono text-center">
                  ${(stage.value_usd / 1000).toFixed(0)}k
                </p>
              )}

              {/* Conversion rate badge (between stages) */}
              {idx < stages.length - 1 && (
                <div className="absolute" style={{ display: 'none' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion rates row */}
      <div className="flex items-center justify-around px-4">
        {stages.map((stage, idx) => (
          <div key={stage.label} className="flex items-center gap-1">
            {idx < stages.length - 1 ? (
              <>
                <span className={cn('text-xs text-muted-foreground')} />
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-mono"
                >
                  {conversionLabels[idx]}
                </Badge>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </>
            ) : null}
          </div>
        ))}
      </div>

      {/* Pipeline value */}
      {totalPipelineValue > 0 && (
        <div className="pt-3 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">Total Pipeline Value</p>
          <p className="text-xl font-bold font-mono text-primary">
            ${totalPipelineValue.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
