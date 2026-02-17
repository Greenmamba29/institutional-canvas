import { useMemo, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertTriangle, Wifi, WifiOff, Zap } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type AuctionBid = Tables<"auction_bids">;

interface LiveBidFeedProps {
  bids: AuctionBid[];
  currentOrgId: string | null;
  extendedCount?: number;
  isConnected?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function LiveBidFeed({ bids, currentOrgId, extendedCount = 0, isConnected = true }: LiveBidFeedProps) {
  const [newBidId, setNewBidId] = useState<string | null>(null);
  const prevBidCountRef = useRef(bids.length);

  const recentBids = useMemo(
    () =>
      [...bids]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15),
    [bids],
  );

  // Detect new bids for pulse animation
  useEffect(() => {
    if (bids.length > prevBidCountRef.current && recentBids.length > 0) {
      const latestBid = recentBids[0];
      setNewBidId(latestBid.id);
      const timer = setTimeout(() => setNewBidId(null), 2000);
      return () => clearTimeout(timer);
    }
    prevBidCountRef.current = bids.length;
  }, [bids.length, recentBids]);

  const sortedByAmount = useMemo(
    () => [...bids].sort((a, b) => b.amount - a.amount),
    [bids],
  );
  const userHasBids = currentOrgId ? bids.some((b) => b.org_id === currentOrgId) : false;
  const isOutbid =
    userHasBids && sortedByAmount.length > 0 && sortedByAmount[0].org_id !== currentOrgId;

  if (recentBids.length === 0) return null;

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Live Feed
        </h2>
        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <div className={cn(
            "flex items-center gap-1 text-xs",
            isConnected ? "text-primary" : "text-destructive"
          )}>
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3 animate-pulse" />
            )}
            <span className="hidden sm:inline">{isConnected ? "Live" : "Reconnecting..."}</span>
          </div>
          {extendedCount > 0 && (
            <Badge variant="outline" className="border-warning/50 text-warning text-[10px] gap-1">
              <Zap className="h-3 w-3" />
              {extendedCount}x ext
            </Badge>
          )}
          <Badge variant="secondary" className="font-mono text-xs">
            {bids.length} bids
          </Badge>
        </div>
      </div>

      {isOutbid && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-xs font-medium text-destructive">You were outbid!</span>
        </div>
      )}

      <ScrollArea className="h-[300px]">
        <div className="p-2 space-y-1">
          {recentBids.map((bid, i) => {
            const isUser = currentOrgId === bid.org_id;
            const isNew = bid.id === newBidId;
            return (
              <div
                key={bid.id}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                  isUser ? "bg-primary/5" : i === 0 ? "bg-accent/50" : "hover:bg-muted/50",
                  isNew && "ring-2 ring-primary/50 animate-pulse"
                )}
                role="listitem"
                aria-label={`Bid of ${formatCurrency(bid.amount, bid.currency)} by ${isUser ? "you" : "another bidder"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isNew ? "bg-primary animate-ping" : "bg-primary"
                  )} />
                  <span className="font-medium">
                    {isUser ? "You" : "Bidder"}
                  </span>
                  {i === 0 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      LATEST
                    </Badge>
                  )}
                  {isNew && (
                    <Badge className="text-[10px] px-1 py-0 bg-primary/20 text-primary animate-bounce">
                      NEW!
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-primary">
                    {formatCurrency(bid.amount, bid.currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(bid.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
