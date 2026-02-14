import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gavel,
  Clock,
  Users,
  DollarSign,
  ArrowUpRight,
  Timer,
  AlertCircle
} from "lucide-react";
import { useAuctions } from "@/hooks/useAuctions";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
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

  const liveAuctions = auctions.filter(a => a.status === 'live');
  const scheduledAuctions = auctions.filter(a => a.status === 'scheduled');
  const endedAuctions = auctions.filter(a => a.status === 'ended');

  if (error) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load Auctions</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </LayoutShell>
    );
  }

  if (isLoading) {
    return (
      <LayoutShell>
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
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Auctions"
          description="Weekly spot auctions for primary lithium and battery recycling materials"
          icon={Gavel}
        />

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
    </LayoutShell>
  );
}

function AuctionCard({ auction, isLive = false }: { auction: Auction; isLive?: boolean }) {
  return (
    <div
      className={`card-premium p-5 ${isLive ? 'border border-destructive/20 animate-pulse-glow' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusPill status={auction.status === 'scheduled' ? 'upcoming' : auction.status === 'live' ? 'live' : 'ended'} />
            <span className="text-xs font-mono text-muted-foreground">{auction.id.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{auction.title}</h3>
            <VerificationBadge tier="lithiumbuy" />
          </div>
          {auction.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{auction.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {auction.status === 'live' ? 'Ends' : auction.status === 'scheduled' ? 'Starts' : 'Ended'}
          </p>
          <p className="font-mono text-sm">
            {new Date(auction.ends_at || auction.starts_at || auction.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="font-mono font-bold">{auction.currency}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Reserve</p>
          <p className="font-mono font-bold">
            {auction.reserve_price ? formatCurrency(auction.reserve_price) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="font-mono font-bold capitalize">{auction.status}</p>
        </div>
      </div>
      {isLive ? (
        <Link to={`/auctions/${auction.id}`}>
          <Button className="w-full bg-gradient-primary text-primary-foreground">
            Enter Auction <ArrowUpRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      ) : (
        <Link to={`/auctions/${auction.id}`}>
          <Button variant="outline" className="w-full">
            <Clock className="h-4 w-4 mr-2" />
            {auction.status === 'scheduled' ? 'View Details' : 'View Results'}
          </Button>
        </Link>
      )}
    </div>
  );
}
