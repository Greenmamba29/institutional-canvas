import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gavel,
  Clock,
  Users,
  DollarSign,
  ArrowUpRight,
  Timer,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useAuctions } from "@/hooks/useAuctions";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { WatchButton, getWatchedIds } from "@/components/auction/WatchButton";
import type { Auction } from "@/services/auctions.service";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Auctions() {
  const { data: auctions = [], isLoading, error } = useAuctions();
  const [filter, setFilter] = useState<"all" | "watched">("all");

  const watchedIds = useMemo(() => getWatchedIds(), []);

  const displayedAuctions = filter === "watched"
    ? auctions.filter((a) => watchedIds.includes(a.id))
    : auctions;

  const liveAuctions = displayedAuctions.filter(a => a.status === 'live');
  const scheduledAuctions = displayedAuctions.filter(a => a.status === 'scheduled');
  const endedAuctions = displayedAuctions.filter(a => a.status === 'ended');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load Auctions</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Auctions"
          description="Weekly spot auctions for lithium and battery metals"
          icon={Gavel}
        />
        <div className="space-y-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Auctions"
          description="Weekly spot auctions for primary lithium and battery recycling materials"
          icon={Gavel}
        />

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "watched")}>
          <TabsList>
            <TabsTrigger value="all">All Auctions</TabsTrigger>
            <TabsTrigger value="watched" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Watched
              {watchedIds.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary rounded-full px-1.5">
                  {watchedIds.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {/* Live Auctions */}
        {liveAuctions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Live Auctions
            </h2>
            {liveAuctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} isLive />
            ))}
          </div>
        )}

        {/* Scheduled Auctions */}
        {scheduledAuctions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Scheduled Auctions
            </h2>
            <div className="grid lg:grid-cols-2 gap-4">
              {scheduledAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        )}

        {/* Ended Auctions */}
        {endedAuctions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Ended Auctions
            </h2>
            <div className="grid lg:grid-cols-2 gap-4">
              {endedAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          </div>
        )}

        {auctions.length === 0 && (
          <div className="glass-panel rounded-xl p-8 text-center">
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No auctions available</h3>
            <p className="text-muted-foreground">Check back later for new auctions</p>
          </div>
        )}
      </div>
    </>
  );
}

function AuctionCard({ auction, isLive = false }: { auction: Auction; isLive?: boolean }) {
  // Live countdown
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    const target = isLive ? auction.end_time || auction.ends_at : auction.start_time || auction.starts_at;
    if (!target) return;

    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [auction.end_time, auction.ends_at, auction.start_time, auction.starts_at, isLive]);

  const productLabel = auction.product_type
    ? auction.product_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  const minBid = auction.current_bid
    ? auction.current_bid + (auction.bid_increment ?? 500)
    : auction.starting_bid ?? 0;

  return (
    <div
      className={`card-premium p-5 ${isLive ? 'border border-destructive/20 animate-pulse-glow' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={auction.status === 'scheduled' ? 'upcoming' : auction.status === 'live' ? 'live' : 'ended'} />
            {productLabel && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {productLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{auction.title}</h3>
            <VerificationBadge tier="lithiumbuy" />
          </div>
          {auction.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{auction.description}</p>
          )}
        </div>
        <div className="flex items-start gap-2">
          <WatchButton auctionId={auction.id} />
          <div className="text-right">
            {isLive && timeLeft ? (
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                <span className="font-mono text-sm font-bold text-destructive">{timeLeft}</span>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {auction.status === 'scheduled' ? 'Starts' : 'Ended'}
                </p>
                <p className="font-mono text-sm">
                  {new Date(auction.end_time || auction.ends_at || auction.start_time || auction.starts_at || auction.created_at).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {auction.current_bid ? 'Current Bid' : 'Starting Bid'}
          </p>
          <p className="font-mono font-bold text-primary">
            {formatCurrency(auction.current_bid ?? auction.starting_bid ?? 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Quantity</p>
          <p className="font-mono font-bold">
            {auction.quantity ? `${auction.quantity} ${auction.unit || 'MT'}` : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Min Next Bid</p>
          <p className="font-mono font-bold">{formatCurrency(minBid)}</p>
        </div>
      </div>

      <Link to={`/auctions/${auction.id}`}>
        {isLive ? (
          <Button className="w-full bg-gradient-primary text-primary-foreground">
            Enter Auction <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            {auction.status === 'scheduled' ? 'View Details' : 'View Results'}
          </Button>
        )}
      </Link>
    </div>
  );
}
