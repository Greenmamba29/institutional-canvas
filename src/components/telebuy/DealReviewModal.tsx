import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useDeal, useRespondToOffer } from '@/hooks/useDeals';

interface DealReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
}

export function DealReviewModal({
  open,
  onOpenChange,
  dealId,
}: DealReviewModalProps) {
  const navigate = useNavigate();
  const { data: deal, isLoading } = useDeal(dealId || '');
  const respondToOffer = useRespondToOffer();

  const handleRespond = async (decision: 'accepted' | 'rejected' | 'counter') => {
    if (!dealId) return;

    try {
      await respondToOffer.mutateAsync({ 
        p_deal_id: dealId, 
        p_decision: decision,
        p_note: '',
      });
      toast.success(
        decision === 'accepted'
          ? 'Offer accepted!'
          : decision === 'rejected'
          ? 'Offer rejected'
          : 'Counter-offer sent'
      );
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to respond to offer:', error);
      toast.error('Failed to respond to offer');
    }
  };

  const handleViewFullDeal = () => {
    onOpenChange(false);
    navigate(`/deals/${dealId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Agreement</DialogTitle>
          <DialogDescription>
            Review the deal terms and respond to the offer
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : deal ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Title</span>
                <span className="text-sm font-medium">{deal.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline">{deal.status}</Badge>
              </div>
              {deal.offer_decision && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Decision</span>
                  <Badge
                    variant={
                      deal.offer_decision === 'accepted'
                        ? 'default'
                        : deal.offer_decision === 'rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {deal.offer_decision}
                  </Badge>
                </div>
              )}
              {deal.offer_note && (
                <div className="pt-2">
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded-md">
                    {deal.offer_note}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleRespond('rejected')}
                disabled={respondToOffer.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleRespond('counter')}
                disabled={respondToOffer.isPending}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Counter
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleRespond('accepted')}
                disabled={respondToOffer.isPending}
              >
                {respondToOffer.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Accept
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active deal found for this session.</p>
            <p className="text-sm mt-1">Start a new deal from the Deals page.</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleViewFullDeal}>
            View Full Deal
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
