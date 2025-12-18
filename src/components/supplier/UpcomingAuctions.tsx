import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight } from 'lucide-react';

interface UpcomingAuction {
  id: string;
  company: string;
  countryCode: string;
  verified: boolean;
  volume: number;
  product: string;
  pricePerMT: number;
}

interface UpcomingAuctionsProps {
  auctions: UpcomingAuction[];
}

const flagEmoji: Record<string, string> = {
  CL: '🇨🇱',
  AU: '🇦🇺',
  CN: '🇨🇳',
  US: '🇺🇸',
  AR: '🇦🇷',
};

export function UpcomingAuctions({ auctions }: UpcomingAuctionsProps) {
  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wider">UPCOMING AUCTIONS</h3>
        <button className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
          <Calendar className="h-3.5 w-3.5" />
          SEE CALENDAR
        </button>
      </div>

      <div className="space-y-3">
        {auctions.map((auction) => (
          <div key={auction.id} className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{flagEmoji[auction.countryCode] || '🏴'}</span>
              <span className="font-medium text-sm">{auction.company}</span>
              {auction.verified && <VerificationBadge tier="gold" showIcon={false} />}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {auction.volume} MT • {auction.product}
              </span>
              <span className="font-mono text-accent">
                @${auction.pricePerMT.toLocaleString()}/MT
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold">
        REGISTER FOR NEXT LOT
        <ArrowRight className="h-3.5 w-3.5 ml-1" />
      </Button>
    </div>
  );
}
