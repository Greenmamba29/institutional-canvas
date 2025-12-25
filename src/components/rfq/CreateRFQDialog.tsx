import { useState } from "react";
import { useCreateRFQ } from "@/hooks/useRFQs";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
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
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export function CreateRFQDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createRFQ = useCreateRFQ();
  const { currentOrgId, hasOrganization, isLoading: orgLoading } = useCurrentOrg();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_id: "", // Will need to select from products
    target_quantity: "",
    target_unit: "MT",
    incoterms: "FOB",
    delivery_location: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please provide an RFQ title",
        variant: "destructive",
      });
      return;
    }

    if (!formData.target_quantity || parseFloat(formData.target_quantity) <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please provide a valid quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!formData.delivery_location.trim()) {
      toast({
        title: "Delivery location required",
        description: "Please provide a delivery location",
        variant: "destructive",
      });
      return;
    }

    // Check if user has an organization
    if (!currentOrgId) {
      console.error('[CreateRFQ] No organization selected');
      toast({
        title: "Organization Required",
        description: "Please complete onboarding and join an organization first",
        variant: "destructive",
        action: (
          <Link to="/onboarding" className="text-sm underline">
            Go to Onboarding
          </Link>
        ),
      });
      return;
    }

    try {
      console.log('[CreateRFQ] Submitting with org:', currentOrgId, formData);
      
      const result = await createRFQ.mutateAsync({
        p_title: formData.title.trim(),
        p_description: formData.description.trim(),
        p_product_id: formData.product_id || "00000000-0000-0000-0000-000000000000", // Temporary fallback
        p_target_quantity: parseFloat(formData.target_quantity),
        p_target_unit: formData.target_unit,
        p_incoterms: formData.incoterms,
        p_delivery_location: formData.delivery_location.trim(),
      });
      
      console.log('[CreateRFQ] Success:', result);

      if (!result || !result.data) {
        throw new Error('RFQ was not saved. Please try again.');
      }

      toast({
        title: "RFQ Created",
        description: `RFQ "${formData.title}" has been published to suppliers`,
      });

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        product_id: "",
        target_quantity: "",
        target_unit: "MT",
        incoterms: "FOB",
        delivery_location: "",
      });
      setOpen(false);
    } catch (error) {
      console.error('[CreateRFQ] Error:', error);
      toast({
        title: "Failed to create RFQ",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Show warning if no organization
  if (!hasOrganization && !orgLoading) {
    return (
      <Link to="/onboarding">
        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
          <AlertCircle className="h-4 w-4 mr-2" />
          Complete Onboarding First
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
          disabled={!currentOrgId || orgLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create RFQ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Request for Quote</DialogTitle>
            <DialogDescription>
              Submit an RFQ to invite suppliers to bid on your requirements
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Lithium Carbonate Q1 2025"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed requirements..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">
                  Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1000"
                  value={formData.target_quantity}
                  onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.target_unit}
                  onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="MT">MT (Metric Tons)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="lbs">lbs (Pounds)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="incoterms">Incoterms</Label>
              <select
                id="incoterms"
                name="incoterms"
                value={formData.incoterms}
                onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="FOB">FOB (Free on Board)</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                <option value="EXW">EXW (Ex Works)</option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery">
                Delivery Location <span className="text-destructive">*</span>
              </Label>
              <Input
                id="delivery"
                placeholder="e.g., Shanghai Port, China"
                value={formData.delivery_location}
                onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createRFQ.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createRFQ.isPending}>
              {createRFQ.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create RFQ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
