import { TrendingUp } from 'lucide-react';

interface MetricsReviewProps {
  totalGMV: number;
  todayChange: number;
  grossMerchandise: number;
  stackedData: number;
  verificationMedia: number;
  escrowedAssets: {
    description: string;
    remainder: string;
    gain: number;
  }[];
}

export function MetricsReview({ 
  totalGMV, 
  todayChange, 
  grossMerchandise, 
  stackedData, 
  verificationMedia,
  escrowedAssets 
}: MetricsReviewProps) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono">${(totalGMV / 1000000).toFixed(2)}M</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-success/20 text-success rounded flex items-center gap-1">
            <TrendingUp className="h-2.5 w-2.5" />
            +{(todayChange / 1000).toFixed(1)}K TODAY
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">GROSS MERCHANDISE VALUE</span>
          <span className="font-semibold">{grossMerchandise}M <span className="text-muted-foreground">INSTITUTIONAL</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">STACKED DATA</span>
          <span className="font-semibold">{stackedData} Firm <span className="text-success">VERIFIED</span></span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">VERIFICATION MEDIA</span>
          <span className="font-semibold">{verificationMedia} Vers <span className="text-accent">GOLD TIER</span></span>
        </div>
      </div>

      <div className="pt-4 border-t border-border/30">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-muted-foreground tracking-wider">GMV ESCROWED</span>
          <select className="text-[10px] bg-transparent text-muted-foreground">
            <option>ALL ASSETS</option>
          </select>
        </div>
        
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-muted-foreground">
              <th className="text-left pb-2">DESCRIPTION</th>
              <th className="text-right pb-2">REMAINDER</th>
              <th className="text-right pb-2">GAIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {escrowedAssets.map((asset, i) => (
              <tr key={i}>
                <td className="py-2">{asset.description}</td>
                <td className="py-2 text-right font-mono">{asset.remainder}</td>
                <td className={`py-2 text-right font-mono ${asset.gain >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {asset.gain >= 0 ? '+' : ''}{asset.gain.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
