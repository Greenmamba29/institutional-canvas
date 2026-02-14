import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';
import { StatusPill } from '@/components/shared/StatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Gavel,
  Clock,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Timer,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { useAuction, useAuctionBids, usePlaceAuctionBid } from '@/hooks/useAuctions';
import { useSubscriptionTier } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
      setIsUrgent(diff < 300000); // < 5 min
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <span className={`font-mono text-lg font-bold ${isUrgent ? 'text-destructive animate-pulse' : 'text-primary'}`}>
      {timeLeft}
    </span>
  );
}

export default function AuctionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: auction, isLoading, error } = useAuction(id || '');
  const { data: bids = [], isLoading: bidsLoading } = useAuctionBids(id || '');
  const placeBid = usePlaceAuctionBid();
  const tier = useSubscriptionTier();
  const { currentOrgId } = useCurrentOrg();
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState('');

  const sortedBids = useMemo(
    () => [...bids].sort((a, b) => b.amount - a.amount),
    [bids]
  );

  const highestBid = sortedBids[0]?.amount ?? 0;
  const isLive = auction?.status === 'live';
  const canBid = isLive && tier !== 'free' && currentOrgId && user;

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (!amount || !id || !currentOrgId || !user) return;

    if (auction?.reserve_price && amount < auction.reserve_price) {
      toast.error(`Bid must meet reserve price of ${formatCurrency(auction.reserve_price, auction.currency)}`);
      return;
    }
    if (amount <= highestBid) {
      toast.error(`Bid must exceed current highest bid of ${formatCurrency(highestBid, auction?.currency)}`);
      return;
    }

    placeBid.mutate({
      p_auction_id: id,
      p_amount: amount,
      p_currency: auction?.currency || 'USD',
    }, {
      onSuccess: () => setBidAmount(''),
    });
  };

  const breadcrumbs = [
    { label: 'AUCTIONS', href: '/auctions' },
    { label: auction?.title || 'Detail' },
  ];

  if (error) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load auction</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Link to="/auctions"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button></Link>
        </div>
      </LayoutShell>
    );
  }

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </LayoutShell>
    );
  }

  if (!auction) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Gavel className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Auction not found</h2>
          <Link to="/auctions"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button></Link>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <BreadcrumbNav items={breadcrumbs} />

        {/* Header */}
        <div className="glass-panel rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusPill status={auction.status === 'live' ? 'live' : auction.status === 'scheduled' ? 'upcoming' : 'ended'} />
                <span className="text-xs font-mono text-muted-foreground">{auction.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-2xl font-bold">{auction.title}</h1>
              {auction.description && (
                <p className="text-muted-foreground mt-1">{auction.description}</p>
              )}
            </div>
            {isLive && auction.ends_at && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                <CountdownTimer endsAt={auction.ends_at} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-mono font-bold">{auction.currency}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reserve Price</p>
              <p className="font-mono font-bold">
                {auction.reserve_price ? formatCurrency(auction.reserve_price, auction.currency) : 'None'}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Highest Bid</p>
              <p className="font-mono font-bold text-primary">
                {highestBid > 0 ? formatCurrency(highestBid, auction.currency) : 'No bids'}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Total Bids</p>
              <p className="font-mono font-bold">{sortedBids.length}</p>
            </div>
          </div>
        </div>

        {/* Anti-sniping notice */}
        {isLive && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20 text-sm">
            <ShieldAlert className="h-4 w-4 text-accent flex-shrink-0" />
            <span className="text-muted-foreground">
              Anti-sniping: Bids in the last 2 minutes extend the auction by 2 minutes.
            </span>
          </div>
        )}

        {/* Bid Form */}
        {isLive && (
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Place a Bid
            </h2>
            {tier === 'free' ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-3">Upgrade to Pro to place bids on auctions.</p>
                <Link to="/settings/billing">
                  <Button>Upgrade to Pro</Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder={highestBid > 0 ? `Min ${formatCurrency(highestBid + 1, auction.currency)}` : 'Enter bid amount'}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="pl-8 font-mono"
                    min={highestBid + 1}
                  />
                </div>
                <Button
                  onClick={handleBid}
                  disabled={placeBid.isPending || !bidAmount}
                  className="bg-gradient-primary text-primary-foreground min-w-[120px]"
                >
                  {placeBid.isPending ? 'Placing...' : 'Place Bid'}
                </Button>
              </div>
            )}
            {auction.reserve_price && highestBid < auction.reserve_price && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Reserve price not yet met
              </p>
            )}
          </div>
        )}

        {/* Bid History */}
        <div className="glass-panel rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Bid History
          </h2>
          {bidsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sortedBids.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No bids placed yet</p>
          ) : (
            <div className="space-y-2">
              {sortedBids.map((bid, idx) => (
                <div
                  key={bid.id}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                    idx === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {idx === 0 && <Badge className="bg-primary/20 text-primary text-[10px]">LEADING</Badge>}
                    <span className="text-xs text-muted-foreground font-mono">
                      {bid.org_id.slice(0, 8)}…
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">{formatCurrency(bid.amount, bid.currency)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(bid.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-start">
          <Link to="/auctions">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Auctions
            </Button>
          </Link>
        </div>
      </div>
    </LayoutShell>
  );
}
