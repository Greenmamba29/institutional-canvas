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
import { useCollectionSites } from "@/hooks/useCollectionSites";
import { useHasFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { MapPin, Building2, Weight } from "lucide-react";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "full", label: "Full" },
];

const PARTNER_TYPE_STYLES: Record<string, string> = {
  rideshare: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  municipal: "bg-green-500/15 text-green-700 border-green-500/30",
  corporate: "bg-purple-500/15 text-purple-700 border-purple-500/30",
  drop_point: "bg-orange-500/15 text-orange-700 border-orange-500/30",
};

const SITE_STATUS_STYLES: Record<string, string> = {
  active: "status-active",
  inactive: "status-pending",
  full: "status-warning",
};

function PartnerTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  const cls = PARTNER_TYPE_STYLES[type] ?? "bg-secondary text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize", cls)}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function SiteStatusPill({ status }: { status: string }) {
  const cls = SITE_STATUS_STYLES[status] ?? "status-pending";
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", cls)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function CollectionSites() {
  const hasFeature = useHasFeature("recycling_registry");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: sites, isLoading } = useCollectionSites(statusFilter !== "all" ? statusFilter : undefined);

  const activeSiteCount = sites?.filter((s) => s.status === "active").length ?? 0;

  const preview = (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Collection Sites"
        description="Battery drop-off and pickup location network"
        icon={MapPin}
      />
      <Skeleton className="h-10 w-48 rounded-lg" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    </div>
  );

  if (!hasFeature) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{preview}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paywall feature="Collection Sites" requiredTier="pro" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Collection Sites"
        description="Battery drop-off and pickup location network"
        icon={MapPin}
        actions={
          !isLoading && sites ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{sites.length} total</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-700 border border-green-500/30">
                {activeSiteCount} active
              </span>
            </div>
          ) : undefined
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Site Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : !sites || sites.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No collection sites found"
          description="No sites match the current filter. Try selecting a different status."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="card-premium p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{site.name}</h3>
                </div>
                <SiteStatusPill status={site.status} />
              </div>

              {site.address && (
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{site.address}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <PartnerTypeBadge type={site.partner_type} />
                {site.capacity_kg != null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Weight className="h-3.5 w-3.5" />
                    <span>{site.capacity_kg.toLocaleString()} kg capacity</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
