/**
 * CreateTelebuySessionDialog
 * 
 * Dialog for scheduling new TeleBuy video negotiation sessions.
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Plus, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateTelebuySession } from '@/hooks/useTelebuy';
import { useSuppliers } from '@/hooks/useSuppliers';

const formSchema = z.object({
  supplierId: z.string().uuid('Please select a supplier'),
  scheduledDate: z.date({ required_error: 'Please select a date' }),
  scheduledTime: z.string().min(1, 'Please select a time'),
  meetingUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateTelebuySessionDialogProps {
  trigger?: React.ReactNode;
}

export function CreateTelebuySessionDialog({ trigger }: CreateTelebuySessionDialogProps) {
  const [open, setOpen] = useState(false);
  const createSession = useCreateTelebuySession();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      scheduledTime: '14:00',
      meetingUrl: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    // Combine date and time
    const scheduledAt = new Date(data.scheduledDate);
    const [hours, minutes] = data.scheduledTime.split(':').map(Number);
    scheduledAt.setHours(hours, minutes, 0, 0);

    await createSession.mutateAsync({
      p_supplier_id: data.supplierId,
      p_scheduled_at: scheduledAt.toISOString(),
      p_meeting_url: data.meetingUrl || undefined,
      p_notes: data.notes,
    });

    setOpen(false);
    form.reset();
  };

  const timeSlots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (const minute of ['00', '30']) {
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      const label = format(new Date(`2000-01-01T${time}`), 'h:mm a');
      timeSlots.push({ value: time, label });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New TeleBuy Session
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Schedule TeleBuy Session
          </DialogTitle>
          <DialogDescription>
            Set up a video negotiation session with a supplier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Select
              onValueChange={(value) => form.setValue('supplierId', value)}
              defaultValue={form.getValues('supplierId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliersLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : suppliers.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    No suppliers available
                  </div>
                ) : (
                  suppliers.map((supplier) => (
                    <SelectItem key={supplier.org_id} value={supplier.org_id}>
                      {supplier.display_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.supplierId && (
              <p className="text-sm text-destructive">
                {form.formState.errors.supplierId.message}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('scheduledDate') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('scheduledDate') ? (
                      format(form.watch('scheduledDate'), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch('scheduledDate')}
                    onSelect={(date) => date && form.setValue('scheduledDate', date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.scheduledDate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.scheduledDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select
                onValueChange={(value) => form.setValue('scheduledTime', value)}
                defaultValue={form.getValues('scheduledTime')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting URL (optional) */}
          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
            <Input
              id="meetingUrl"
              placeholder="https://meet.google.com/..."
              {...form.register('meetingUrl')}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to generate a meeting link automatically
            </p>
            {form.formState.errors.meetingUrl && (
              <p className="text-sm text-destructive">
                {form.formState.errors.meetingUrl.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Discussion topics, documents to review..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createSession.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Session
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTelebuySessionDialog;
