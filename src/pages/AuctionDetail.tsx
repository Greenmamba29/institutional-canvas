import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
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

function getTimeRemaining(endsAt: string): string | null {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentOrgId } = useCurrentOrg();

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
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  useEffect(() => {
    if (!auction?.ends_at) return;
    setTimeLeft(getTimeRemaining(auction.ends_at));
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(auction.ends_at!);
      setTimeLeft(remaining);
      if (remaining === null) {
        clearInterval(interval);
        // Auto-refetch when countdown hits zero (Task 6)
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

  // Task 2: Outbid detection
  const userHasBids = currentOrgId ? bids.some((b) => b.org_id === currentOrgId) : false;
  const isOutbid = userHasBids && highBid != null && highBid.org_id !== currentOrgId;

  // -- Map auction status to StatusPill type --------------------------------
  const statusPillType =
    auction?.status === "live"
      ? "live"
      : auction?.status === "scheduled"
        ? "upcoming"
        : auction?.status === "cancelled"
          ? "error"
          : "ended";

  // -- Handlers -------------------------------------------------------------
  const handlePlaceBid = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !bidAmount) return;

    const amount = parseFloat(bidAmount);
    const increment = auction?.bid_increment ?? 500;

    // Validate against starting bid
    if (auction?.starting_bid && !highBid && amount < auction.starting_bid) {
      toast.error(`Bid must be at least ${formatCurrency(auction.starting_bid, auction.currency)}`);
      return;
    }

    // Validate against highest bid + increment
    if (highBid && amount < highBid.amount + increment) {
      toast.error(`Bid must be at least ${formatCurrency(highBid.amount + increment, highBid.currency)} (current + ${formatCurrency(increment)})`);
      return;
    }

    // Validate against reserve price
    if (auction?.reserve_price && amount < auction.reserve_price) {
      toast.warning(`Bid is below reserve price of ${formatCurrency(auction.reserve_price, auction.currency)}`);
    }

    // Task 7: Check terms acceptance first
    const userId = currentOrgId || "anonymous";
    if (!hasAcceptedTerms(userId)) {
      setPendingBidAmount(amount);
      setShowTermsDialog(true);
      return;
    }

    // Task 3: Show confirmation dialog
    setPendingBidAmount(amount);
    setShowConfirmDialog(true);
  }, [id, bidAmount, auction, highBid, currentOrgId]);

  const handleTermsAccepted = useCallback(() => {
    const userId = currentOrgId || "anonymous";
    markTermsAccepted(userId);
    setShowTermsDialog(false);
    // Now show confirmation dialog
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
        onSuccess: () => {
          setBidAmount("");
          setShowConfirmDialog(false);
        },
        onError: () => {
          setShowConfirmDialog(false);
        },
      },
    );
  }, [id, pendingBidAmount, bidCurrency, placeBid]);

  // -- Loading state --------------------------------------------------------
  if (auctionLoading) {
    return (
      <LayoutShell>
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
      </LayoutShell>
    );
  }

  // -- Error state ----------------------------------------------------------
  if (auctionError || !auction) {
    return (
      <LayoutShell>
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
      </LayoutShell>
    );
  }

  // -- Render ---------------------------------------------------------------
  const isLive = auction.status === "live";
  const isEnded = auction.status === "ended" || auction.status === "cancelled";
  const extendedCount = auction.extended_count ?? 0;

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        {/* Breadcrumb */}
        <BreadcrumbNav
          items={[
            { label: "Auctions", href: "/auctions" },
            { label: auction.title },
          ]}
        />

        {/* Task 2: Outbid Alert Banner */}
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
                aria-label="Dismiss"
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

        {/* Task 6: Winner Announcement */}
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
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/auctions">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-3 rounded-xl bg-primary/10">
              <Gavel className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{auction.title}</h1>
                <StatusPill status={statusPillType} />
                {/* Task 4: Extension Indicator */}
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
                          This auction was extended {extendedCount} time{extendedCount > 1 ? "s" : ""} due to last-minute bids (anti-sniping rule).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {auction.description && (
                <p className="text-sm text-muted-foreground max-w-xl">{auction.description}</p>
              )}
              <span className="text-xs font-mono text-muted-foreground">{auction.id.slice(0, 8)}</span>
            </div>
          </div>
          {/* Task 5: Watch Button */}
          <WatchButton auctionId={auction.id} variant="default" />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current High Bid + Countdown */}
            <div
              className={`card-premium p-6 ${isLive ? "border border-destructive/20 animate-pulse-glow" : ""}`}
            >
              <div className="grid sm:grid-cols-2 gap-6">
                {/* High Bid */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Current High Bid
                  </p>
                  {highBid ? (
                    <p className="text-3xl font-bold font-mono text-primary">
                      {formatCurrency(highBid.amount, highBid.currency)}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-muted-foreground">No bids yet</p>
                  )}
                  {auction.reserve_price != null && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {reserveMet ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-xs font-medium text-success">Reserve met</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-warning" />
                          <span className="text-xs font-medium text-warning">Reserve not met</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Countdown */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {isLive ? "Time Remaining" : isEnded ? "Auction Ended" : "Starts In"}
                  </p>
                  {isLive && timeLeft ? (
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <p className="text-3xl font-bold font-mono">{timeLeft}</p>
                    </div>
                  ) : isLive && !timeLeft ? (
                    <p className="text-xl font-semibold text-muted-foreground">Ending...</p>
                  ) : isEnded ? (
                    <p className="text-xl font-semibold text-muted-foreground">
                      {auction.ends_at ? formatDateTime(auction.ends_at) : "-"}
                    </p>
                  ) : (
                    <p className="text-xl font-semibold text-muted-foreground">
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

            {/* Task 1: Live Bid Feed */}
            <LiveBidFeed bids={bids} currentOrgId={currentOrgId} />

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Bidder</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Time</TableHead>
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
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDateTime(bid.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Lot Details */}
            <div className="glass-panel rounded-xl p-5 space-y-4">
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
                  <span className="font-mono font-bold capitalize">{auction.status}</span>
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
              </div>
            </div>

            {/* Bid Submission Form */}
            <div className="card-premium p-5 space-y-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Place a Bid
              </h2>

              {isLive ? (
                <form onSubmit={handlePlaceBid} className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Bid Amount
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      placeholder={
                        highBid
                          ? `Min ${formatCurrency(highBid.amount + (auction.bid_increment ?? 500), auction.currency)}`
                          : auction.starting_bid
                            ? `Min ${formatCurrency(auction.starting_bid, auction.currency)}`
                            : "Enter amount"
                      }
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Currency
                    </label>
                    <Input
                      type="text"
                      maxLength={3}
                      placeholder="USD"
                      value={bidCurrency}
                      onChange={(e) => setBidCurrency(e.target.value.toUpperCase())}
                      required
                      className="font-mono uppercase"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary text-primary-foreground"
                    disabled={placeBid.isPending || !bidAmount}
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
              ) : (
                <div className="text-center py-4">
                  <Timer className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {isEnded
                      ? "This auction has ended. Bidding is closed."
                      : "This auction has not started yet. Bidding will open when the auction goes live."}
                  </p>
                </div>
              )}
            </div>

            {/* Anti-Sniping Notice */}
            <div className="glass-panel rounded-xl p-4 border border-warning/20">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-warning/10">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-warning mb-0.5">Anti-Sniping Rule</p>
                  <p className="text-xs text-muted-foreground">
                    Bids in the last 2 minutes extend the auction by 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task 3: Bid Confirmation Dialog */}
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

      {/* Task 7: Terms Acceptance Dialog */}
      <AuctionTermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleTermsAccepted}
      />
    </LayoutShell>
  );
}
