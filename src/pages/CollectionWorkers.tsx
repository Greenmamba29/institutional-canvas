import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Paywall } from "@/components/shared/Paywall";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollectionWorkers } from "@/hooks/useCollectionSites";
import { useHasFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

const KYC_STYLES: Record<string, string> = {
  approved: "bg-green-500/15 text-green-700 border-green-500/30",
  pending: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const TRAINING_STYLES: Record<string, string> = {
  complete: "bg-green-500/15 text-green-700 border-green-500/30",
  incomplete: "bg-secondary text-muted-foreground border-border",
};

const KYC_FILTER_OPTIONS = [
  { value: "all", label: "All KYC Statuses" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

function KycBadge({ status }: { status: string }) {
  const cls = KYC_STYLES[status] ?? "bg-secondary text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", cls)}>
      {status}
    </span>
  );
}

function TrainingBadge({ status }: { status: string }) {
  const cls = TRAINING_STYLES[status] ?? TRAINING_STYLES.incomplete;
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", cls)}>
      {status}
    </span>
  );
}

export default function CollectionWorkers() {
  const hasFeature = useHasFeature("battery_collection");
  const [kycFilter, setKycFilter] = useState("all");

  const { data: workers, isLoading } = useCollectionWorkers();

  const filtered = workers
    ? kycFilter === "all"
      ? workers
      : workers.filter((w) => w.kyc_status === kycFilter)
    : [];

  const preview = (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Collection Workers"
        description="Field collector management and compliance status"
        icon={Users}
      />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!hasFeature) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{preview}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paywall feature="Collection Workers" requiredTier="enterprise" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Collection Workers"
        description="Field collector management and compliance status"
        icon={Users}
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={kycFilter} onValueChange={setKycFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by KYC status" />
          </SelectTrigger>
          <SelectContent>
            {KYC_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Partner ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">KYC Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pay Rate</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Active Contracts</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState
                      icon={Users}
                      title="No workers found"
                      description="No workers match the current filter. Try a different KYC status."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((worker) => (
                  <tr key={worker.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                    <td className="py-3 px-4 font-medium">{worker.name}</td>
                    <td className="py-3 px-4 text-muted-foreground font-mono text-xs">
                      {worker.partner_id
                        ? `${worker.partner_id.slice(0, 8)}…`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <KycBadge status={worker.kyc_status} />
                    </td>
                    <td className="py-3 px-4">
                      <TrainingBadge status={worker.training_status} />
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {worker.pay_rate_usd != null
                        ? `$${worker.pay_rate_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 font-mono">{worker.active_contracts}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
