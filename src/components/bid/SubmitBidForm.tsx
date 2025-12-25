import { useState } from "react";
import { useSubmitBid } from "@/hooks/useBids";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gavel, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubmitBidFormProps {
  rfqId: string;
  supplierId: string;
}

export function SubmitBidForm({ rfqId, supplierId }: SubmitBidFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const submitBid = useSubmitBid();

  const [formData, setFormData] = useState({
    price: "",
    currency: "USD",
    quantity: "",
    lead_time_days: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.price || !formData.quantity || !formData.lead_time_days) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitBid.mutateAsync({
        p_rfq_id: rfqId,
        p_supplier_id: supplierId,
        p_price: parseFloat(formData.price),
        p_currency: formData.currency,
        p_quantity: parseFloat(formData.quantity),
        p_lead_time_days: parseInt(formData.lead_time_days, 10),
        p_notes: formData.notes,
      });

      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted to the buyer",
      });

      // Reset form and close dialog
      setFormData({
        price: "",
        currency: "USD",
        quantity: "",
        lead_time_days: "",
        notes: "",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to submit bid",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Gavel className="h-4 w-4 mr-2" />
          Submit Bid
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Submit Your Bid</DialogTitle>
            <DialogDescription>
              Provide your competitive pricing and delivery terms
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">
                  Price per Unit <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="66500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="CNY">CNY</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="quantity">
                Available Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Quantity you can supply (in MT or specified unit)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lead_time">
                Lead Time (Days) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lead_time"
                type="number"
                min="1"
                placeholder="30"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Payment terms, quality specs, certifications..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitBid.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitBid.isPending}>
              {submitBid.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Bid
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
