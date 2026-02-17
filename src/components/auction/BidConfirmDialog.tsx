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
import { Gavel } from "lucide-react";

interface BidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidAmount: number;
  currency: string;
  auctionTitle: string;
  minIncrement: number;
  onConfirm: () => void;
  isPending: boolean;
}

function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BidConfirmDialog({
  open,
  onOpenChange,
  bidAmount,
  currency,
  auctionTitle,
  minIncrement,
  onConfirm,
  isPending,
}: BidConfirmDialogProps) {
  const [accepted, setAccepted] = useState(false);

  const handleConfirm = () => {
    if (!accepted) return;
    onConfirm();
    setAccepted(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-primary" />
            Confirm Your Bid
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>You are about to place a bid on:</p>
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Auction</span>
                  <span className="font-semibold">{auctionTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Bid</span>
                  <span className="font-mono font-bold text-primary text-lg">
                    {formatCurrency(bidAmount, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Min Increment</span>
                  <span className="font-mono">{formatCurrency(minIncrement, currency)}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="bid-binding"
                  checked={accepted}
                  onCheckedChange={(v) => setAccepted(v === true)}
                />
                <Label htmlFor="bid-binding" className="text-sm leading-snug cursor-pointer">
                  I understand this bid is binding and cannot be retracted once placed.
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!accepted || isPending}
            className="bg-gradient-primary text-primary-foreground"
          >
            {isPending ? "Placing..." : "Confirm Bid"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
