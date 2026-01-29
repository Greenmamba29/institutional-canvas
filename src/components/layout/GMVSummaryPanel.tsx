import { forwardRef } from 'react';
import { SparklineChart } from '@/components/shared/SparklineChart';
import { TrendingUp } from 'lucide-react';

interface GMVSummaryPanelProps {
  gmvYTD: number;
  changePercent: number;
  suppliersVerified: number;
  buyersVerified: number;
  sparklineData: number[];
}

export const GMVSummaryPanel = forwardRef<HTMLDivElement, GMVSummaryPanelProps>(
  ({ gmvYTD, changePercent, suppliersVerified, buyersVerified, sparklineData }, ref) => {
    return (
      <div ref={ref} className="p-3 border-t border-border/50 bg-secondary/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground tracking-wider">GMV (YTD)</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold bg-success/20 text-success rounded">
              <TrendingUp className="h-2.5 w-2.5" />
              +{changePercent}%
            </span>
          </div>
          <p className="text-lg font-bold font-mono">${(gmvYTD / 1000000).toFixed(1)}M</p>
          
          <SparklineChart data={sparklineData} color="accent" height={24} />
          
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
            <div>
              <p className="text-[10px] text-muted-foreground">PARTNERS</p>
              <p className="text-xs font-semibold">{suppliersVerified} <span className="text-success">VERIFIED</span></p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">NETWORKS</p>
              <p className="text-xs font-semibold">{buyersVerified.toLocaleString()} <span className="text-success">ACTIVE</span></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

GMVSummaryPanel.displayName = 'GMVSummaryPanel';
