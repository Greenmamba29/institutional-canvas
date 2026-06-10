import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

import { useCreatePurchase } from "@/hooks/usePurchases";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Form schema.
 *
 * Only `supplierOrgId`, `totalAmount`, `currency`, and `notes` map to first-class
 * columns accepted by the `create_purchase` RPC (CreatePurchaseParams). The
 * descriptive fields (product, quantity, unit price) are carried in `payload`,
 * which the RPC accepts as an opaque JSON bag.
 */
const formSchema = z.object({
  supplierOrgId: z.string().trim().uuid("Supplier must be a valid organization ID"),
  product: z.string().trim().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitPrice: z.coerce.number().nonnegative("Unit price cannot be negative"),
  currency: z.string().trim().min(1).default("USD"),
  notes: z.string().trim().max(2000).optional(),
});

type FormValues = z.input<typeof formSchema>;

const CURRENCIES = ["USD", "EUR", "GBP", "CNY", "JPY", "AUD"];

export function NewPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const createPurchase = useCreatePurchase();
  const { currentOrgId } = useCurrentOrg();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierOrgId: "",
      product: "",
      quantity: undefined,
      unitPrice: undefined,
      currency: "USD",
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!currentOrgId) {
      toast.error("Organization required", {
        description: "Please select an organization before creating a purchase.",
      });
      return;
    }

    const parsed = formSchema.parse(values);
    const quantity = parsed.quantity;
    const unitPrice = parsed.unitPrice;
    const totalAmount = Number((quantity * unitPrice).toFixed(2));

    try {
      const result = await createPurchase.mutateAsync({
        buyerOrgId: currentOrgId,
        supplierOrgId: parsed.supplierOrgId,
        totalAmount,
        currency: parsed.currency,
        notes: parsed.notes || undefined,
        payload: {
          product: parsed.product,
          quantity,
          unit_price: unitPrice,
        },
      });

      if (!result) {
        throw new Error("Purchase was not saved. Please try again.");
      }

      toast.success("Purchase created", {
        description: `Purchase order for ${parsed.product} has been created.`,
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to create purchase", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Record a new purchase order with a supplier.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="supplierOrgId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Organization ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000000-0000-0000-0000-000000000000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Lithium Carbonate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="1000"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="25.00"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Notes{" "}
                      <span className="text-xs text-muted-foreground">(Optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about this purchase..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={createPurchase.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createPurchase.isPending || !currentOrgId}>
                {createPurchase.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Purchase
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
