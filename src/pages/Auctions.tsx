import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import {
  Gavel,
  Clock,
  Users,
  DollarSign,
  Package,
  ArrowUpRight,
  TrendingUp,
  Timer
} from "lucide-react";
import { auctions, formatCurrency, formatVolume } from "@/data/mockData";

export default function Auctions() {
  const liveAuctions = auctions.filter(a => a.status === 'live');
  const upcomingAuctions = auctions.filter(a => a.status === 'upcoming');

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Auctions"
          description="Weekly spot auctions for lithium and battery metals"
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
              <div
                key={auction.id}
                className="card-premium p-6 border border-destructive/20 animate-pulse-glow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <StatusPill status="live" />
                      <span className="text-sm text-muted-foreground font-mono">{auction.id}</span>
                    </div>
                    <h3 className="text-xl font-bold">{auction.title}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Ends In</p>
                      <p className="text-2xl font-bold font-mono tabular-nums text-destructive">01:45:32</p>
                    </div>
                    <Link to={`/auctions/${auction.id}`}>
                      <Button className="bg-gradient-primary text-primary-foreground">
                        Enter Auction <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="glass-panel rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-xs">Lots</span>
                    </div>
                    <p className="text-xl font-bold font-mono">{auction.lots.length}</p>
                  </div>
                  <div className="glass-panel rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">Total Value</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-gradient-primary">{formatCurrency(auction.totalValue)}</p>
                  </div>
                  <div className="glass-panel rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs">Volume</span>
                    </div>
                    <p className="text-xl font-bold font-mono">{formatVolume(auction.totalVolume, 'MT')}</p>
                  </div>
                  <div className="glass-panel rounded-lg p-3">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Participants</span>
                    </div>
                    <p className="text-xl font-bold font-mono">{auction.participantsCount}</p>
                  </div>
                </div>

                {/* Lots */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Lots</h4>
                  <div className="grid lg:grid-cols-3 gap-4">
                    {auction.lots.map((lot) => (
                      <div
                        key={lot.id}
                        className="glass-panel rounded-lg p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">
                            Lot #{lot.lotNumber}
                          </span>
                          <span className="text-xs text-muted-foreground">{lot.bidsCount} bids</span>
                        </div>
                        <h5 className="font-semibold mb-1">{lot.commodity}</h5>
                        <p className="text-sm text-muted-foreground mb-3">{lot.grade} • {lot.origin}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Current Bid</p>
                            <p className="font-mono font-bold text-lg text-gradient-gold">{formatCurrency(lot.currentBid)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Volume</p>
                            <p className="font-mono font-bold">{formatVolume(lot.volume, lot.unit)}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Leading: <span className="text-foreground">{lot.leadingBidder}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Auctions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Upcoming Auctions
          </h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {upcomingAuctions.map((auction) => (
              <div key={auction.id} className="card-premium p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusPill status="upcoming" />
                      <span className="text-xs font-mono text-muted-foreground">{auction.id}</span>
                    </div>
                    <h3 className="font-semibold">{auction.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Starts</p>
                    <p className="font-mono text-sm">{new Date(auction.startTime).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Lots</p>
                    <p className="font-mono font-bold">{auction.lots.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-mono font-bold">{formatVolume(auction.totalVolume, 'MT')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Est. Value</p>
                    <p className="font-mono font-bold">{formatCurrency(auction.totalValue)}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Set Reminder
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* TODO Stub */}
        <div className="glass-panel rounded-xl p-6 border-dashed border-2 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <h3 className="font-semibold">Phase 2: Real-time Bidding</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            TODO: Implement WebSocket connections for live bid updates, countdown timers, and real-time notifications.
          </p>
        </div>
      </div>
    </LayoutShell>
  );
}
