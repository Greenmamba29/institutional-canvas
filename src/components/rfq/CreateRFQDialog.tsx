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

const PRODUCT_TYPES = [
  'Lithium Carbonate (Li₂CO₃)',
  'Lithium Hydroxide (LiOH)',
  'Spodumene Concentrate',
  'Black Mass',
  'Graphite (Natural)',
  'Graphite (Synthetic)',
  'Cobalt Sulphate',
  'Nickel Sulphate',
  'Manganese Sulphate',
];

const PURITY_GRADES = [
  'Battery-Grade (>99.5%)',
  'Technical-Grade (>98%)',
  'Industrial-Grade (>95%)',
  'Standard-Grade',
];

const PAYMENT_TERMS_OPTIONS = [
  'Letter of Credit (L/C)',
  'Prepayment (100%)',
  'Prepayment (50%) + L/C',
  'Net 30',
  'Net 60',
  'Documentary Collection',
];

const CERTIFICATION_OPTIONS = [
  'ISO 9001',
  'ISO 14001',
  'Battery-Grade SGS',
  'ISRI Certified',
  'Chain of Custody (CoC)',
  'REACH Compliant',
  'RoHS Compliant',
  'UN 38.3 (Battery Transport)',
];

const SELECT_CLASS = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function CreateRFQDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createRFQ = useCreateRFQ();
  const { currentOrgId, hasOrganization, isLoading: orgLoading } = useCurrentOrg();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    product_id: "",
    target_quantity: "",
    target_unit: "MT",
    incoterms: "FOB",
    delivery_location: "",
    // Enterprise fields
    product_type: "",
    purity_grade: "",
    submission_deadline: "",
    payment_terms: "",
    required_certifications: [] as string[],
  });

  const toggleCert = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      required_certifications: prev.required_certifications.includes(cert)
        ? prev.required_certifications.filter(c => c !== cert)
        : [...prev.required_certifications, cert],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({ title: "Title required", description: "Please provide an RFQ title", variant: "destructive" });
      return;
    }
    if (!formData.target_quantity || parseFloat(formData.target_quantity) <= 0) {
      toast({ title: "Invalid quantity", description: "Please provide a valid quantity greater than 0", variant: "destructive" });
      return;
    }
    if (!formData.delivery_location.trim()) {
      toast({ title: "Delivery location required", description: "Please provide a delivery location", variant: "destructive" });
      return;
    }
    if (!currentOrgId) {
      toast({
        title: "Organization Required",
        description: "Please complete onboarding and join an organization first",
        variant: "destructive",
        action: <Link to="/onboarding" className="text-sm underline">Go to Onboarding</Link>,
      });
      return;
    }

    try {
      const result = await createRFQ.mutateAsync({
        p_title: formData.title.trim(),
        p_description: formData.description.trim(),
        p_product_id: formData.product_id || null,
        p_target_quantity: parseFloat(formData.target_quantity),
        p_target_unit: formData.target_unit,
        p_incoterms: formData.incoterms,
        p_delivery_location: formData.delivery_location.trim(),
        p_product_type: formData.product_type || null,
        p_purity_grade: formData.purity_grade || null,
        p_submission_deadline: formData.submission_deadline || null,
        p_payment_terms: formData.payment_terms || null,
        p_required_certifications: formData.required_certifications.length > 0 ? formData.required_certifications : null,
      });

      if (!result) throw new Error('RFQ was not saved. Please try again.');

      toast({ title: "RFQ Created", description: `"${formData.title}" has been published to suppliers` });

      setFormData({
        title: "", description: "", product_id: "", target_quantity: "",
        target_unit: "MT", incoterms: "FOB", delivery_location: "",
        product_type: "", purity_grade: "", submission_deadline: "",
        payment_terms: "", required_certifications: [],
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Failed to create RFQ",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Request for Quote</DialogTitle>
            <DialogDescription>
              Submit an RFQ to invite suppliers to bid on your requirements
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">

            {/* ── Core fields ── */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                placeholder="e.g., Battery-Grade Li₂CO₃ — Q3 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                aria-required="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product_type">Product Type</Label>
                <select
                  id="product_type"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">Select product…</option>
                  {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purity_grade">Purity / Grade</Label>
                <select
                  id="purity_grade"
                  value={formData.purity_grade}
                  onChange={(e) => setFormData({ ...formData, purity_grade: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">Select grade…</option>
                  {PURITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity <span className="text-destructive">*</span></Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000"
                  value={formData.target_quantity}
                  onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  value={formData.target_unit}
                  onChange={(e) => setFormData({ ...formData, target_unit: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="MT">MT (Metric Tons)</option>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="lbs">lbs (Pounds)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="incoterms">Incoterms</Label>
                <select
                  id="incoterms"
                  value={formData.incoterms}
                  onChange={(e) => setFormData({ ...formData, incoterms: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                  <option value="CFR">CFR (Cost & Freight)</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <select
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">Select terms…</option>
                  {PAYMENT_TERMS_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="delivery">Delivery Location <span className="text-destructive">*</span></Label>
                <Input
                  id="delivery"
                  placeholder="e.g., Shanghai Port, China"
                  value={formData.delivery_location}
                  onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
                  aria-required="true"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="submission_deadline">Submission Deadline</Label>
                <Input
                  id="submission_deadline"
                  type="date"
                  value={formData.submission_deadline}
                  onChange={(e) => setFormData({ ...formData, submission_deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Additional Requirements <span className="text-xs text-muted-foreground">(Optional)</span></Label>
              <Textarea
                id="description"
                placeholder="Packaging specs, origin requirements, sampling protocol, ESG criteria…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Required Certifications <span className="text-xs text-muted-foreground">(Select all that apply)</span></Label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATION_OPTIONS.map(cert => {
                  const selected = formData.required_certifications.includes(cert);
                  return (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCert(cert)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {cert}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={createRFQ.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRFQ.isPending}>
              {createRFQ.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish RFQ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
