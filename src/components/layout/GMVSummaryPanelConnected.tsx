/**
 * GMV Summary Panel - Connected to Real Data
 * 
 * Wraps GMVSummaryPanel with real data from useGMVStats hook
 */

import { useGMVStats, useGMVSparkline } from '@/hooks/useGMVStats';
import { GMVSummaryPanel } from './GMVSummaryPanel';
import { Skeleton } from '@/components/ui/skeleton';

export function GMVSummaryPanelConnected() {
  const { data: gmvStats, isLoading } = useGMVStats();
  const sparklineData = useGMVSparkline();

  if (isLoading) {
    return (
      <div className="p-3 border-t border-border/50 bg-secondary/20 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-full" />
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  return (
    <GMVSummaryPanel
      gmvYTD={gmvStats?.gmvYTD || 0}
      changePercent={gmvStats?.changePercent || 0}
      suppliersVerified={gmvStats?.suppliersVerified || 0}
      buyersVerified={gmvStats?.buyersVerified || 0}
      sparklineData={sparklineData}
    />
  );
}
