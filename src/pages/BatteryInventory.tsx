import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Paywall } from "@/components/shared/Paywall";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBatteryInventory } from "@/hooks/useBatteryInventory";
import { useChainOfCustody } from "@/hooks/useChainOfCustody";
import { useHasFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Battery, X, ArrowRight, Truck, Package } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  collected: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  in_transit: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  at_processor: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  processed: "bg-green-500/15 text-green-700 border-green-500/30",
  sold: "bg-slate-500/15 text-slate-600 border-slate-500/30",
};

function BatteryStatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", cls)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function CustodyPanel({ inventoryId, onClose }: { inventoryId: string; onClose: () => void }) {
  const { data: records, isLoading } = useChainOfCustody(inventoryId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-background border-l border-border shadow-xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Chain of Custody</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        <p className="text-xs text-muted-foreground mb-4 font-mono truncate">Battery: {inventoryId}</p>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : !records || records.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No custody records found</p>
        ) : (
          <ol className="relative border-l border-border/50 ml-3 space-y-6">
            {records.map((record, idx) => (
              <li key={record.id} className="ml-6">
                <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-border ring-4 ring-background text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    {new Date(record.transfer_time).toLocaleString()}
                  </p>
                  {record.transport_mode && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{record.transport_mode}</span>
                    </div>
                  )}
                  {record.condition && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{record.condition}</span>
                    </div>
                  )}
                  {record.new_owner && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Owner: {record.new_owner.slice(0, 8)}…
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "collected", label: "Collected" },
  { value: "in_transit", label: "In Transit" },
  { value: "at_processor", label: "At Processor" },
  { value: "processed", label: "Processed" },
  { value: "sold", label: "Sold" },
];

export default function BatteryInventory() {
  const hasFeature = useHasFeature("recycling_registry");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeSearch, setTypeSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    battery_type: typeSearch.trim() || undefined,
  };

  const { data: batteries, isLoading } = useBatteryInventory(filters);

  const preview = (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Battery Inventory"
        description="Track and manage your battery collection registry"
        icon={Battery}
      />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!hasFeature) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{preview}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paywall feature="Battery Inventory" requiredTier="pro" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Battery Inventory"
          description="Track and manage your battery collection registry"
          icon={Battery}
        />

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Search by battery type..."
            value={typeSearch}
            onChange={(e) => setTypeSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Table */}
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Battery Type</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Chemistry</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Weight (kg)</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">SoC %</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Collected</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <Skeleton className="h-5 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !batteries || batteries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-0">
                      <EmptyState
                        icon={Battery}
                        title="No batteries found"
                        description="No batteries match the current filters. Try adjusting your search."
                      />
                    </td>
                  </tr>
                ) : (
                  batteries.map((battery) => (
                    <tr
                      key={battery.id}
                      className="border-b border-border/30 last:border-0 hover:bg-secondary/20"
                    >
                      <td className="py-3 px-4 font-medium">{battery.battery_type}</td>
                      <td className="py-3 px-4 text-muted-foreground">{battery.chemistry ?? "—"}</td>
                      <td className="py-3 px-4 font-mono">
                        {battery.weight_kg != null ? battery.weight_kg.toFixed(1) : "—"}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {battery.state_of_charge != null ? `${battery.state_of_charge}%` : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <BatteryStatusBadge status={battery.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(battery.collected_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedId(battery.id)}
                        >
                          View Custody
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      {selectedId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedId(null)}
          />
          <CustodyPanel inventoryId={selectedId} onClose={() => setSelectedId(null)} />
        </>
      )}
    </>
  );
}
