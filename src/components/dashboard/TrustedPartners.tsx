import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerificationBadge } from '@/components/shared/VerificationBadge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export interface TrustedPartner {
  id: string;
  name: string;
  verified: boolean;
  verificationTier: 'gold' | 'standard';
  ytdRevenue: number;
  completedDeals: number;
  product: string;
  pricePerMT: number;
  responseTime: string;
  imageUrl?: string;
}

interface TrustedPartnersProps {
  partners: TrustedPartner[];
}

export function TrustedPartners({ partners }: TrustedPartnersProps) {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [heldIds, setHeldIds] = useState<Set<string>>(new Set());

  const toggleHold = (id: string) =>
    setHeldIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-wider">GLOBAL PARTNERS</h3>
          <p className="text-[10px] text-muted-foreground">LITHIUM & RECYCLING VERIFIED</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Advanced Sourcing Analytics</p>
          <p className="text-[10px] text-muted-foreground">Verification Pipeline</p>
        </div>
      </div>

      <div className="grid gap-4">
        {partners.map((partner) => (
          <div key={partner.id} className="glass-panel rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground shrink-0">
                {partner.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold truncate">{partner.name}</h4>
                  <VerificationBadge tier={partner.verificationTier} showIcon={false} />
                </div>
                <p className="text-lg font-bold text-accent font-mono mt-1">
                  {format(partner.ytdRevenue)} <span className="text-xs font-normal">YTD REVENUE</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {partner.completedDeals} COMPLETED {partner.completedDeals === 1 ? 'DEAL' : 'DEALS'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{partner.product}</span>
              <span className="text-success">VERIFIED {partner.responseTime} RESPONSE</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold font-mono">{format(partner.pricePerMT)}</span>
                <span className="text-xs text-muted-foreground"> /MT</span>
              </div>
              <span className="text-[10px] text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded">
                SPOT ADJUSTED MARKET
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/30">
              <Button
                variant={heldIds.has(partner.id) ? 'secondary' : 'outline'}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => toggleHold(partner.id)}
              >
                {heldIds.has(partner.id) ? 'ON HOLD' : 'HOLD'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => navigate('/marketplace')}
              >
                MORE DETAILS
              </Button>
              <Button
                size="sm"
                className="flex-1 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => navigate('/deals')}
              >
                ESCROW <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/marketplace')}>
        VIEW GLOBAL DIRECTORY
      </Button>
    </div>
  );
}
