import { useState } from "react";
import { useCreateDeal } from "@/hooks/useDeals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Award, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AwardDealButtonProps {
  bidId: string;
  supplierId: string;
  rfqId: string;
  bidPrice?: number;
  bidQuantity?: number;
}

export function AwardDealButton({
  bidId,
  supplierId,
  rfqId,
  bidPrice,
  bidQuantity,
}: AwardDealButtonProps) {
  const [open, setOpen] = useState(false);
  const [dealTitle, setDealTitle] = useState("");
  const { toast } = useToast();
  const createDeal = useCreateDeal();

  const handleAward = async () => {
    if (!dealTitle.trim()) {
      toast({
        title: "Deal title required",
        description: "Please provide a title for this deal",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDeal.mutateAsync({
        p_supplier_id: supplierId,
        p_rfq_id: rfqId,
        p_title: dealTitle,
      });

      toast({
        title: "Deal Awarded",
        description: "The supplier has been notified and can now accept or reject the deal.",
      });

      setDealTitle("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to award deal",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
          <Award className="h-4 w-4 mr-2" />
          Award Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Award Deal to Winning Bid</DialogTitle>
          <DialogDescription>
            Confirm that you want to award this deal to the selected supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Bid Summary */}
          {bidPrice && bidQuantity && (
            <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
              <h4 className="font-medium text-sm">Bid Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  <span className="font-medium">Price:</span> ${bidPrice.toLocaleString()} per unit
                </p>
                <p>
                  <span className="font-medium">Quantity:</span> {bidQuantity.toLocaleString()} MT
                </p>
                <p>
                  <span className="font-medium">Total Value:</span> $
                  {(bidPrice * bidQuantity).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Deal Title */}
          <div className="grid gap-2">
            <Label htmlFor="deal-title">
              Deal Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="deal-title"
              placeholder="e.g., Lithium Carbonate Q1 2025 Supply Agreement"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be the official name of the deal contract
            </p>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-500">
              <strong>Note:</strong> Awarding this deal will notify the supplier and create a
              binding agreement pending their acceptance.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={createDeal.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAward}
            disabled={createDeal.isPending || !dealTitle.trim()}
            className="bg-green-600 hover:bg-green-700"
          >
            {createDeal.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm Award
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
