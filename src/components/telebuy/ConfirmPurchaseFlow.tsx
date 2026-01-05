import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateDeal } from '@/hooks/useDeals';
import { useCreatePurchase } from '@/hooks/usePurchases';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuth } from '@/context/AuthContext';

interface ConfirmPurchaseFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  supplierName?: string;
  sessionId: string;
  totalAmount?: number;
}

type FlowStep = 'confirm' | 'processing' | 'success';

export function ConfirmPurchaseFlow({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  sessionId,
  totalAmount = 0,
}: ConfirmPurchaseFlowProps) {
  const navigate = useNavigate();
  const { currentOrgId } = useCurrentOrg();
  const { user } = useAuth();
  const createDeal = useCreateDeal();
  const createPurchase = useCreatePurchase();

  const [step, setStep] = useState<FlowStep>('confirm');
  const [dealTitle, setDealTitle] = useState(`TeleBuy Session Deal - ${new Date().toLocaleDateString()}`);
  const [amount, setAmount] = useState(totalAmount);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!currentOrgId || !supplierId || !user?.id) {
      toast.error('Missing required information');
      return;
    }

    setStep('processing');

    try {
      // Step 1: Create deal with correct RPC parameters
      const dealResult = await createDeal.mutateAsync({
        p_title: dealTitle,
        p_supplier_id: supplierId,
        p_rfq_id: currentOrgId, // Using org as placeholder since rfq_id is required
      });

      const newDealId = dealResult?.data?.id;

      // Step 2: Create purchase linked to deal
      const purchaseResult = await createPurchase.mutateAsync({
        buyerOrgId: currentOrgId,
        supplierOrgId: supplierId,
        dealId: newDealId,
        totalAmount: amount,
        currency: 'USD',
        notes: `Created from TeleBuy session: ${sessionId}`,
      });

      setPurchaseId(purchaseResult?.purchase_id || null);
      setStep('success');
      toast.success('Purchase confirmed successfully!');
    } catch (error) {
      console.error('Failed to confirm purchase:', error);
      toast.error('Failed to confirm purchase');
      setStep('confirm');
    }
  };

  const handleViewOrders = () => {
    onOpenChange(false);
    navigate('/orders');
  };

  const handleClose = () => {
    setStep('confirm');
    setPurchaseId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Purchase Confirmed!' : 'Confirm Purchase'}
          </DialogTitle>
          <DialogDescription>
            {step === 'confirm' && `Complete your purchase${supplierName ? ` with ${supplierName}` : ''}`}
            {step === 'processing' && 'Processing your purchase...'}
            {step === 'success' && 'Your order has been created successfully'}
          </DialogDescription>
        </DialogHeader>

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dealTitle">Deal Title</Label>
              <Input
                id="dealTitle"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="Enter deal title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={!dealTitle || amount <= 0}>
                Confirm Purchase
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Creating your order...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-4 text-center">
              <span className="block text-lg font-medium">Order Created</span>
              {purchaseId && (
                <span className="text-sm text-muted-foreground">
                  PO Number: {purchaseId}
                </span>
              )}
            </p>
            <Button onClick={handleViewOrders} className="mt-6">
              View Orders
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
