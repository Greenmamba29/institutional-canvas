import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePurchase } from '@/hooks/usePurchases';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

const purchaseFormSchema = z.object({
  totalAmount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  notes: z.string().max(1000).optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface CreatePurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId?: string;
  supplierName?: string;
  dealId?: string;
}

export function CreatePurchaseModal({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  dealId,
}: CreatePurchaseModalProps) {
  const navigate = useNavigate();
  const { currentOrgId } = useCurrentOrg();
  const createPurchase = useCreatePurchase();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      totalAmount: 0,
      notes: '',
    },
  });

  const onSubmit = async (values: PurchaseFormValues) => {
    if (!currentOrgId || !supplierId) {
      toast.error('Missing organization or supplier information');
      return;
    }

    try {
      await createPurchase.mutateAsync({
        buyerOrgId: currentOrgId,
        supplierOrgId: supplierId,
        dealId: dealId,
        totalAmount: values.totalAmount,
        currency: 'USD',
        notes: values.notes,
      });

      toast.success('Added to cart successfully');
      onOpenChange(false);
      form.reset();
      navigate('/purchases');
    } catch (error) {
      console.error('Failed to create purchase:', error);
      toast.error('Failed to add to cart');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Cart</DialogTitle>
          <DialogDescription>
            Create a purchase order{supplierName ? ` with ${supplierName}` : ''}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this purchase..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPurchase.isPending}>
                {createPurchase.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add to Cart
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
