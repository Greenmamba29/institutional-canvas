import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";

import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Gavel,
  ArrowLeft,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Timer,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Hash,
  Send,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useAuction, useAuctionBids, usePlaceAuctionBid } from "@/hooks/useAuctions";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { toast } from "sonner";
import type { AuctionBid } from "@/services/auctions.service";
import { LiveBidFeed } from "@/components/auction/LiveBidFeed";
import { BidConfirmDialog } from "@/components/auction/BidConfirmDialog";
import { AuctionTermsDialog, hasAcceptedTerms, markTermsAccepted } from "@/components/auction/AuctionTermsDialog";
import { WatchButton } from "@/components/auction/WatchButton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTimeRemaining(endsAt: string): { text: string; totalSeconds: number } | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let text: string;
  if (days > 0) text = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  else if (hours > 0) text = `${hours}h ${minutes}m ${seconds}s`;
  else text = `${minutes}m ${seconds}s`;

  return { text, totalSeconds };
}

// ---------------------------------------------------------------------------
// Quick Bid Increments
// ---------------------------------------------------------------------------
const QUICK_BID_INCREMENTS = [500, 1000, 5000];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentOrgId } = useCurrentOrg();
  const bidFormRef = useRef<HTMLFormElement>(null);

  const {
    data: auction,
    isLoading: auctionLoading,
    error: auctionError,
    refetch,
  } = useAuction(id || "");

  const {
    data: bids = [],
    isLoading: bidsLoading,
  } = useAuctionBids(id || "");

  const placeBid = usePlaceAuctionBid();

  // -- Bid form state -------------------------------------------------------
  const [bidAmount, setBidAmount] = useState("");
  const [bidCurrency, setBidCurrency] = useState("USD");

  // -- Dialog states --------------------------------------------------------
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState(0);
  const [outbidDismissed, setOutbidDismissed] = useState(false);

  // -- Live countdown timer -------------------------------------------------
  const [timeLeft, setTimeLeft] = useState<{ text: string; totalSeconds: number } | null>(null);

  useEffect(() => {
    if (!auction?.ends_at) return;
    setTimeLeft(getTimeRemaining(auction.ends_at));
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(auction.ends_at!);
      setTimeLeft(remaining);
      if (remaining === null) {
        clearInterval(interval);
        refetch();
      }
    }, 1_000);
    return () => clearInterval(interval);
  }, [auction?.ends_at, refetch]);

  // -- Derived data ---------------------------------------------------------
  const sortedBids = useMemo(
    () => [...bids].sort((a, b) => b.amount - a.amount),
    [bids],
  );

  const highBid = sortedBids.length > 0 ? sortedBids[0] : null;

  const reserveMet =
    auction?.reserve_price != null && highBid != null
      ? highBid.amount >= auction.reserve_price
      : false;

  const bidderMap = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 0;
    for (const bid of sortedBids) {
      if (!map.has(bid.org_id)) {
        counter += 1;
        map.set(bid.org_id, counter);
      }
    }
    return map;
  }, [sortedBids]);

  const userBidderNumber = currentOrgId ? bidderMap.get(currentOrgId) ?? null : null;

  const userPosition = useMemo(() => {
    if (!currentOrgId) return null;
    const idx = sortedBids.findIndex((b) => b.org_id === currentOrgId);
    return idx === -1 ? null : idx + 1;
  }, [sortedBids, currentOrgId]);

  const userHasBids = currentOrgId ? bids.some((b) => b.org_id === currentOrgId) : false;
  const isOutbid = userHasBids && highBid != null && highBid.org_id !== currentOrgId;

  // Closing soon detection (last 10 minutes)
  const isClosingSoon = timeLeft != null && timeLeft.totalSeconds <= 600;
  // Critical closing (last 2 minutes)
  const isCritical = timeLeft != null && timeLeft.totalSeconds <= 120;

  // Min next bid calculation
  const minNextBid = useMemo(() => {
    if (!auction) return 0;
    if (highBid) return highBid.amount + (auction.bid_increment ?? 500);
    return auction.starting_bid ?? 0;
  }, [auction, highBid]);

  // -- Status pill mapping --------------------------------------------------
  const statusPillType =
    auction?.status === "live"
      ? "live"
      : auction?.status === "scheduled"
        ? "upcoming"
        : auction?.status === "cancelled"
          ? "error"
          : "ended";

  // -- Handlers -------------------------------------------------------------
  const submitBid = useCallback((amount: number) => {
    if (!id || !auction) return;

    const increment = auction.bid_increment ?? 500;

    if (auction.starting_bid && !highBid && amount < auction.starting_bid) {
      toast.error(`Bid must be at least ${formatCurrency(auction.starting_bid, auction.currency)}`);
      return;
    }

    if (highBid && amount < highBid.amount + increment) {
      toast.error(`Bid must be at least ${formatCurrency(highBid.amount + increment, highBid.currency)} (current + ${formatCurrency(increment)})`);
      return;
    }

    if (auction.reserve_price && amount < auction.reserve_price) {
      toast.warning(`Bid is below reserve price of ${formatCurrency(auction.reserve_price, auction.currency)}`);
    }

    const userId = currentOrgId || "anonymous";
    if (!hasAcceptedTerms(userId)) {
      setPendingBidAmount(amount);
      setShowTermsDialog(true);
      return;
    }

    setPendingBidAmount(amount);
    setShowConfirmDialog(true);
  }, [id, auction, highBid, currentOrgId]);

  const handlePlaceBid = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!bidAmount) return;
    submitBid(parseFloat(bidAmount));
  }, [bidAmount, submitBid]);

  // Quick bid handler
  const handleQuickBid = useCallback((increment: number) => {
    const base = highBid ? highBid.amount : (auction?.starting_bid ?? 0);
    submitBid(base + increment);
  }, [highBid, auction, submitBid]);

  const handleTermsAccepted = useCallback(() => {
    const userId = currentOrgId || "anonymous";
    markTermsAccepted(userId);
    setShowTermsDialog(false);
    setShowConfirmDialog(true);
  }, [currentOrgId]);

  const handleConfirmBid = useCallback(() => {
    if (!id) return;
    placeBid.mutate(
      {
        p_auction_id: id,
        p_amount: pendingBidAmount,
        p_currency: bidCurrency,
      },
      {
        onSuccess: (data) => {
          setBidAmount("");
          setShowConfirmDialog(false);
          setOutbidDismissed(false);
          // Check if auction was extended
          if (data && typeof data === 'object' && 'was_extended' in data && data.was_extended) {
            toast.info("⏰ Auction extended by 2 minutes (anti-sniping)", { duration: 5000 });
            refetch(); // Refresh auction data to get new end time
          }
        },
        onError: () => {
          setShowConfirmDialog(false);
        },
      },
    );
  }, [id, pendingBidAmount, bidCurrency, placeBid, refetch]);

  // Keyboard shortcut: Enter to focus bid input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        (bidFormRef.current?.querySelector('input[type="number"]') as HTMLElement | null)?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -- Loading state --------------------------------------------------------
  if (auctionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-72" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // -- Error state ----------------------------------------------------------
  if (auctionError || !auction) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Auction not found</h3>
        <p className="text-muted-foreground mb-4">
          The auction you are looking for does not exist or you do not have access.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" asChild>
            <Link to="/auctions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Auctions
            </Link>
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // -- Render ---------------------------------------------------------------
  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended" || auction.status === "cancelled";
  const isScheduled = auction.status === "scheduled";
  const extendedCount = auction.extended_count ?? 0;

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <BreadcrumbNav
          items={[
            { label: "Auctions", href: "/auctions" },
            { label: auction.title },
          ]}
        />

        {/* Closing Soon Warning */}
        {isLive && isClosingSoon && !isCritical && (
          <Alert className="border-warning/30 bg-warning/5">
            <Clock className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Closing Soon!</AlertTitle>
            <AlertDescription>
              This auction ends in less than 10 minutes. Place your bid now!
            </AlertDescription>
          </Alert>
        )}

        {/* Critical Closing Warning */}
        {isLive && isCritical && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5 animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Final Moments!</AlertTitle>
            <AlertDescription>
              Less than 2 minutes remaining. Bids placed now will trigger a 2-minute extension.
            </AlertDescription>
          </Alert>
        )}

        {/* Outbid Alert Banner */}
        {isOutbid && !outbidDismissed && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              You&apos;ve been outbid!
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setOutbidDismissed(true)}
                aria-label="Dismiss outbid alert"
              >
                <X className="h-3 w-3" />
              </Button>
            </AlertTitle>
            <AlertDescription>
              Place a new bid to regain your position. Current highest bid is{" "}
              <span className="font-mono font-bold">
                {highBid ? formatCurrency(highBid.amount, highBid.currency) : "—"}
              </span>.
            </AlertDescription>
          </Alert>
        )}

        {/* Winner Announcement */}
        {isEnded && auction.winner_id && (
          <div className="card-premium p-6 border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-bold">
                  {auction.winner_id === currentOrgId
                    ? "🎉 You Won This Auction!"
                    : "Auction Closed — Winner Determined"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {auction.winner_id === currentOrgId
                    ? "Congratulations! You will receive payment instructions shortly."
                    : "This auction has concluded. Thank you for participating."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/auctions" aria-label="Back to auctions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-2.5 md:p-3 rounded-xl bg-primary/10 shrink-0">
              <Gavel className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{auction.title}</h1>
                <StatusPill status={statusPillType} />
                {extendedCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="border-warning/50 text-warning animate-pulse gap-1">
                          <Zap className="h-3 w-3" />
                          EXTENDED x{extendedCount}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs max-w-[200px]">
                          Extended {extendedCount} time{extendedCount > 1 ? "s" : ""} due to last-minute bids (anti-sniping).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {isScheduled && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Scheduled
                  </Badge>
                )}
              </div>
              {auction.description && (
                <p className="text-sm text-muted-foreground max-w-xl">{auction.description}</p>
              )}
              <span className="text-xs font-mono text-muted-foreground">{auction.id.slice(0, 8)}</span>
            </div>
          </div>
          <WatchButton auctionId={auction.id} variant="default" />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current High Bid + Countdown */}
            <div
              className={cn(
                "card-premium p-4 md:p-6",
                isLive && "border border-destructive/20",
                isCritical && "animate-pulse border-destructive/40"
              )}
            >
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {/* High Bid */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current High Bid
                  </p>
                  {highBid ? (
                    <p className="text-2xl md:text-3xl font-bold font-mono text-primary">
                      {formatCurrency(highBid.amount, highBid.currency)}
                    </p>
                  ) : (
                    <p className="text-lg md:text-xl font-semibold text-muted-foreground">No bids yet</p>
                  )}
                  {auction.reserve_price != null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {reserveMet ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">Reserve met</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-warning" />
                          <span className="text-xs font-medium text-warning">Reserve not met</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* Min next bid display */}
                  {isLive && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Min next bid:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {formatCurrency(minNextBid, auction.currency)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Countdown */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {isLive ? "Time Remaining" : isEnded ? "Auction Ended" : "Starts In"}
                  </p>
                  {isLive && timeLeft ? (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "h-2 w-2 rounded-full animate-pulse",
                        isCritical ? "bg-destructive" : isClosingSoon ? "bg-warning" : "bg-destructive"
                      )} />
                      <p className={cn(
                        "text-2xl md:text-3xl font-bold font-mono",
                        isCritical && "text-destructive"
                      )}>
                        {timeLeft.text}
                      </p>
                    </div>
                  ) : isLive && !timeLeft ? (
                    <p className="text-xl font-semibold text-muted-foreground">Ending...</p>
                  ) : isEnded ? (
                    <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                      {auction.ends_at ? formatDateTime(auction.ends_at) : "-"}
                    </p>
                  ) : (
                    <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                      {auction.starts_at ? formatDateTime(auction.starts_at) : "-"}
                    </p>
                  )}
                </div>
              </div>

              {/* User position */}
              {userPosition !== null && (
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">
                    Your position:{" "}
                    <span className="text-primary font-bold">
                      {userPosition === 1
                        ? "1st (Highest Bidder)"
                        : `${userPosition}${userPosition === 2 ? "nd" : userPosition === 3 ? "rd" : "th"}`}
                    </span>
                    {userBidderNumber !== null && (
                      <span className="text-muted-foreground ml-2">(Bidder #{userBidderNumber})</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Live Bid Feed */}
            <LiveBidFeed
              bids={bids}
              currentOrgId={currentOrgId}
              extendedCount={extendedCount}
            />

            {/* Bid History Table */}
            <div className="glass-panel rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Bid History
                  {sortedBids.length > 0 && (
                    <span className="text-xs text-muted-foreground">({sortedBids.length})</span>
                  )}
                </h2>
              </div>

              {bidsLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : sortedBids.length === 0 ? (
                <div className="p-8 text-center">
                  <Gavel className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No bids have been placed yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Bidder</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBids.map((bid, index) => {
                        const bidderNum = bidderMap.get(bid.org_id) ?? 0;
                        const isUserBid = currentOrgId === bid.org_id;

                        return (
                          <TableRow
                            key={bid.id}
                            className={isUserBid ? "bg-primary/5" : undefined}
                          >
                            <TableCell className="font-mono text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              Bidder #{bidderNum}
                              {isUserBid && (
                                <span className="ml-2 text-xs text-primary font-semibold">(You)</span>
                              )}
                              {index === 0 && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary">
                                  HIGHEST
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              {formatCurrency(bid.amount, bid.currency)}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground hidden sm:table-cell">
                              {formatDateTime(bid.created_at)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Lot Details */}
            <div className="glass-panel rounded-xl p-4 md:p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Lot Details
              </h2>

              <div className="space-y-3">
                {auction.product_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-mono font-bold capitalize">
                      {auction.product_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
                {auction.quantity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono font-bold">{auction.quantity} {auction.unit || 'MT'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Starting Bid</span>
                  <span className="font-mono font-bold">
                    {auction.starting_bid != null
                      ? formatCurrency(auction.starting_bid, auction.currency)
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bid Increment</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(auction.bid_increment ?? 500, auction.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reserve Price</span>
                  <span className="font-mono font-bold">
                    {auction.reserve_price != null
                      ? formatCurrency(auction.reserve_price, auction.currency)
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={
                    auction.status === 'live' ? 'default' :
                    auction.status === 'scheduled' ? 'secondary' :
                    auction.status === 'ended' ? 'outline' : 'destructive'
                  } className="capitalize font-mono text-xs">
                    {auction.status}
                  </Badge>
                </div>
                {auction.starts_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starts</span>
                    <span className="font-mono text-xs">{formatDateTime(auction.starts_at)}</span>
                  </div>
                )}
                {auction.ends_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ends</span>
                    <span className="font-mono text-xs">{formatDateTime(auction.ends_at)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Bids</span>
                  <span className="font-mono font-bold">{sortedBids.length}</span>
                </div>
                {extendedCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Extensions</span>
                    <span className="font-mono font-bold text-warning">{extendedCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bid Submission Form */}
            <div className="card-premium p-4 md:p-5 space-y-4" id="bid-form">
              <h2 className="font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Place a Bid
              </h2>

              {isLive ? (
                <div className="space-y-4">
                  <form ref={bidFormRef} onSubmit={handlePlaceBid} className="space-y-3">
                    <div>
                      <label htmlFor="bid-amount" className="text-xs text-muted-foreground mb-1 block">
                        Bid Amount ({auction.currency})
                      </label>
                      <Input
                        id="bid-amount"
                        type="number"
                        min={0}
                        step="any"
                        placeholder={`Min ${formatCurrency(minNextBid, auction.currency)}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        required
                        className="font-mono"
                        aria-label={`Enter bid amount, minimum ${formatCurrency(minNextBid, auction.currency)}`}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary text-primary-foreground"
                      disabled={placeBid.isPending || !bidAmount}
                      aria-label="Submit bid"
                    >
                      {placeBid.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Placing Bid...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit Bid
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Quick Bid Buttons */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Quick Bid</p>
                    <div className="grid grid-cols-3 gap-2">
                      {QUICK_BID_INCREMENTS.map((inc) => (
                        <Button
                          key={inc}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickBid(inc)}
                          disabled={placeBid.isPending}
                          className="font-mono text-xs"
                          aria-label={`Quick bid plus ${formatCurrency(inc)}`}
                        >
                          +{formatCurrency(inc)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Keyboard shortcut hint */}
                  <p className="text-[10px] text-muted-foreground text-center">
                    Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono">B</kbd> to focus bid input
                  </p>
                </div>
              ) : isScheduled ? (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This auction hasn't started yet.
                  </p>
                  {auction.starts_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Starts: {formatDateTime(auction.starts_at)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Timer className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    This auction has ended. Bidding is closed.
                  </p>
                </div>
              )}
            </div>

            {/* Anti-Sniping Notice */}
            <div className="glass-panel rounded-xl p-4 border border-warning/20">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-warning/10 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-warning mb-0.5">Anti-Sniping Rule</p>
                  <p className="text-xs text-muted-foreground">
                    Bids in the last 2 minutes extend the auction by 2 minutes. This auction has been extended {extendedCount} time{extendedCount !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bid Confirmation Dialog */}
      <BidConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        bidAmount={pendingBidAmount}
        currency={bidCurrency}
        auctionTitle={auction.title}
        minIncrement={auction.bid_increment ?? 500}
        onConfirm={handleConfirmBid}
        isPending={placeBid.isPending}
      />

      {/* Terms Acceptance Dialog */}
      <AuctionTermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleTermsAccepted}
      />
    </>
  );
}
