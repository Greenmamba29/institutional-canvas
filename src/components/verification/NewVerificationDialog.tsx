/**
 * NewVerificationDialog
 *
 * Dialog for submitting a new KYB verification request into
 * `kyb_verification_queue`. Mirrors CreateRFQDialog structure: shadcn Dialog +
 * react-hook-form + zod + useMutation/react-query + sonner toast.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useCreateVerification } from './useCreateVerification';

const TIER_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'kyc', label: 'KYC' },
  { value: 'standard', label: 'Standard' },
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'lithiumbuy', label: 'LithiumBuy Verified' },
] as const;

const formSchema = z.object({
  verificationTier: z.string().min(1, 'Please select a verification tier'),
  notes: z.string().max(2000, 'Notes are too long').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewVerificationDialogProps {
  trigger?: React.ReactNode;
  /** Optional controlled open state (e.g. to open from an EmptyState action). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewVerificationDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: NewVerificationDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const createVerification = useCreateVerification();
  const { currentOrgId, hasOrganization, isLoading: orgLoading } = useCurrentOrg();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationTier: 'basic',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!currentOrgId) {
      toast.error('Organization required', {
        description: 'Please complete onboarding and join an organization first',
      });
      return;
    }

    try {
      await createVerification.mutateAsync({
        org_id: currentOrgId,
        verification_tier: data.verificationTier,
        notes: data.notes,
      });

      toast.success('Verification request submitted', {
        description: 'Your request has been added to the review queue',
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error('Failed to submit verification', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // Guard: require an organization before allowing submission
  if (!hasOrganization && !orgLoading) {
    return (
      <Link to="/onboarding">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <ShieldCheck className="h-4 w-4 mr-2" />
          Complete Onboarding First
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={!currentOrgId || orgLoading}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              New Verification
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            New Verification Request
          </DialogTitle>
          <DialogDescription>
            Submit a KYB verification request for your organization to the compliance review queue
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Requested Tier */}
          <div className="space-y-2">
            <Label htmlFor="verificationTier">Requested Tier</Label>
            <Select
              defaultValue={form.getValues('verificationTier')}
              onValueChange={(value) =>
                form.setValue('verificationTier', value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="verificationTier">
                <SelectValue placeholder="Select a verification tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.verificationTier && (
              <p className="text-sm text-destructive">
                {form.formState.errors.verificationTier.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-xs text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Provide context for the reviewer, entity details, or documents to expect..."
              rows={4}
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-destructive">{form.formState.errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createVerification.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createVerification.isPending}>
              {createVerification.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Submit Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default NewVerificationDialog;
