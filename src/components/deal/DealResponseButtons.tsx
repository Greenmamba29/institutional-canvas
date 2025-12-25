import { useState } from "react";
import { useRespondToOffer } from "@/hooks/useDeals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DealResponseButtonsProps {
  dealId: string;
  currentStatus?: string;
}

export function DealResponseButtons({ dealId, currentStatus }: DealResponseButtonsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const { toast } = useToast();
  const respondToOffer = useRespondToOffer();

  // Don't show buttons if deal is already finalized
  if (currentStatus === "accepted" || currentStatus === "rejected") {
    return null;
  }

  const handleAccept = async () => {
    try {
      await respondToOffer.mutateAsync({
        p_deal_id: dealId,
        p_decision: "accepted",
        p_note: "",
      });

      toast({
        title: "Deal Accepted",
        description: "You have accepted this deal. The buyer will be notified.",
      });
    } catch (error) {
      toast({
        title: "Failed to accept deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!rejectNote.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this deal",
        variant: "destructive",
      });
      return;
    }

    try {
      await respondToOffer.mutateAsync({
        p_deal_id: dealId,
        p_decision: "rejected",
        p_note: rejectNote,
      });

      toast({
        title: "Deal Rejected",
        description: "You have rejected this deal. The buyer will be notified.",
      });

      setRejectNote("");
      setRejectDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to reject deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleAccept}
          disabled={respondToOffer.isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {respondToOffer.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Accept Deal
        </Button>

        <Button
          variant="destructive"
          onClick={() => setRejectDialogOpen(true)}
          disabled={respondToOffer.isPending}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject Deal
        </Button>
      </div>

      {/* Reject Dialog with Note */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Deal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this deal. This will be shared with the buyer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject-note">
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reject-note"
                placeholder="e.g., Pricing does not meet our current capacity, Unable to meet delivery timeline..."
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectNote("");
              }}
              disabled={respondToOffer.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={respondToOffer.isPending || !rejectNote.trim()}
            >
              {respondToOffer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
