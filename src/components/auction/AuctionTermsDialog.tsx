import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";

interface AuctionTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
}

const TERMS_KEY_PREFIX = "lithiumbuy_auction_terms_";

export function hasAcceptedTerms(userId: string): boolean {
  try {
    return localStorage.getItem(`${TERMS_KEY_PREFIX}${userId}`) === "true";
  } catch {
    return false;
  }
}

export function markTermsAccepted(userId: string): void {
  try {
    localStorage.setItem(`${TERMS_KEY_PREFIX}${userId}`, "true");
  } catch {
    // localStorage unavailable
  }
}

export function AuctionTermsDialog({ open, onOpenChange, onAccept }: AuctionTermsDialogProps) {
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (!accepted) return;
    onAccept();
    setAccepted(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Auction Terms & Conditions
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>Please review and accept the auction terms before placing your first bid.</p>
              <ScrollArea className="h-[200px] rounded-lg border border-border p-4">
                <div className="space-y-3 text-sm">
                  <h4 className="font-semibold">1. Binding Bids</h4>
                  <p>All bids placed on LithiumBuy auctions are legally binding. By placing a bid, you commit to completing the purchase at the bid price if you are the winning bidder.</p>

                  <h4 className="font-semibold">2. Anti-Sniping Policy</h4>
                  <p>Bids placed within the final 2 minutes of an auction will automatically extend the auction by 2 minutes, up to a maximum of 10 extensions.</p>

                  <h4 className="font-semibold">3. Payment Terms</h4>
                  <p>Winning bidders must complete payment within 48 hours of auction close. Failure to pay may result in account suspension and forfeiture of any deposits.</p>

                  <h4 className="font-semibold">4. Reserve Prices</h4>
                  <p>Some auctions may have a reserve price. If the reserve is not met, the seller is not obligated to complete the sale.</p>

                  <h4 className="font-semibold">5. Compliance</h4>
                  <p>All transactions are subject to applicable export controls, sanctions, and trade regulations. Buyers are responsible for ensuring compliance with all applicable laws.</p>

                  <h4 className="font-semibold">6. Dispute Resolution</h4>
                  <p>Any disputes arising from auction transactions will be resolved through LithiumBuy's arbitration process.</p>
                </div>
              </ScrollArea>

              <div className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="terms-accept"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                />
                <Label htmlFor="terms-accept" className="text-sm leading-snug cursor-pointer">
                  I have read and agree to the auction terms and conditions.
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAccept} disabled={!accepted}>
            Accept & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
