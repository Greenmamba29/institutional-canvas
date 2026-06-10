import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/StatusPill";
import { Database } from "@/integrations/supabase/types";

type Purchase = Database["public"]["Tables"]["purchases"]["Row"];

type StatusType = "active" | "success" | "warning" | "error" | "pending";

const statusMap: Record<string, StatusType> = {
  pending: "pending",
  confirmed: "active",
  shipped: "warning",
  delivered: "success",
  completed: "success",
  cancelled: "error",
};

interface PurchaseDetailsDialogProps {
  purchase: Purchase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/30 last:border-0">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-right">{children}</span>
    </div>
  );
}

export function PurchaseDetailsDialog({
  purchase,
  open,
  onOpenChange,
}: PurchaseDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
          <DialogDescription>
            {purchase?.purchase_id
              ? `Details for ${purchase.purchase_id}`
              : "Read-only view of this purchase order."}
          </DialogDescription>
        </DialogHeader>

        {purchase ? (
          <div className="grid gap-1 py-2">
            <DetailRow label="PO Number">
              <span className="font-mono font-semibold text-primary">
                {purchase.purchase_id || "—"}
              </span>
            </DetailRow>

            <DetailRow label="Status">
              <StatusPill status={statusMap[purchase.status || "pending"] || "pending"} />
            </DetailRow>

            <DetailRow label="Amount">
              <span className="font-mono font-semibold">
                {purchase.total_amount != null
                  ? `$${purchase.total_amount.toLocaleString()}`
                  : "—"}
              </span>
            </DetailRow>

            <DetailRow label="Currency">{purchase.currency || "USD"}</DetailRow>

            <DetailRow label="Buyer Org">
              <span className="font-mono text-xs">{purchase.buyer_org_id || "—"}</span>
            </DetailRow>

            <DetailRow label="Supplier Org">
              <span className="font-mono text-xs">{purchase.supplier_org_id || "—"}</span>
            </DetailRow>

            {purchase.deal_id ? (
              <DetailRow label="Deal">
                <span className="font-mono text-xs">{purchase.deal_id}</span>
              </DetailRow>
            ) : null}

            {purchase.notes ? (
              <DetailRow label="Notes">
                <span className="whitespace-pre-wrap">{purchase.notes}</span>
              </DetailRow>
            ) : null}

            <DetailRow label="Created">
              {purchase.created_at
                ? format(new Date(purchase.created_at), "MMM d, yyyy h:mm a")
                : "—"}
            </DetailRow>

            {purchase.updated_at ? (
              <DetailRow label="Updated">
                {format(new Date(purchase.updated_at), "MMM d, yyyy h:mm a")}
              </DetailRow>
            ) : null}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No purchase selected.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
