import { Globe, Users } from 'lucide-react';

interface WeeklyAuctionSnapshotProps {
  totalBids: number;
  changePercent: number;
  activeLots: number;
  lotType: string;
  verifiedBidders: number;
}

export function WeeklyAuctionSnapshot({ 
  totalBids, 
  changePercent, 
  activeLots, 
  lotType, 
  verifiedBidders 
}: WeeklyAuctionSnapshotProps) {
  return (
    <div className="glass-panel rounded-xl p-5 relative overflow-hidden">
      <h3 className="text-sm font-semibold tracking-wider mb-4">WEEKLY AUCTION SNAPSHOT</h3>
      
      {/* Globe visualization - simplified SVG */}
      <div className="relative h-40 flex items-center justify-center mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-primary/20 relative">
            <div className="absolute inset-2 rounded-full border border-primary/10" />
            <div className="absolute inset-4 rounded-full border border-primary/5" />
            {/* Connection dots */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="absolute bottom-6 left-4 w-2 h-2 rounded-full bg-primary animate-pulse delay-100" />
            <div className="absolute top-1/2 right-2 w-2 h-2 rounded-full bg-success animate-pulse delay-200" />
            <div className="absolute bottom-8 right-6 w-2 h-2 rounded-full bg-accent animate-pulse delay-300" />
          </div>
        </div>
        <Globe className="h-12 w-12 text-primary/40" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-2xl font-bold font-mono text-accent">${(totalBids / 1000).toFixed(0)}K</p>
          <p className="text-[10px] text-muted-foreground">TOTAL BIDS</p>
          <p className="text-[10px] text-success">+{changePercent}% vs last event</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">{activeLots}</p>
          <p className="text-[10px] text-muted-foreground">ACTIVE LOTS</p>
          <p className="text-[10px] text-accent uppercase">{lotType}</p>
        </div>
        <div>
          <p className="text-2xl font-bold font-mono">{verifiedBidders}</p>
          <p className="text-[10px] text-muted-foreground">VERIFIED BIDDERS</p>
          <div className="flex items-center justify-center gap-0.5 mt-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-5 h-5 -ml-1 first:ml-0 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[8px] font-bold">
                {i}
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">+{verifiedBidders - 4}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
