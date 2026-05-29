import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { Paywall } from "@/components/shared/Paywall";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useComplianceAuditLogs } from "@/hooks/useCompliance";
import { useBatteryInventory } from "@/hooks/useBatteryInventory";
import { useCollectionSites, useCollectionWorkers } from "@/hooks/useCollectionSites";
import { useFlashAlerts } from "@/hooks/useFlashAlerts";
import { useHasFeature } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Battery,
  MapPin,
  ClipboardList,
  Users,
  AlertTriangle,
  Info,
  Zap,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

const REGULATORY_ITEMS = [
  { label: "EPA RCRA", detail: "Universal Waste Rules", status: "compliant", color: "text-green-600", bg: "bg-green-500/10 border-green-500/20" },
  { label: "EU 2023/1542", detail: "Battery Regulation (Recycled Content)", status: "in-progress", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "CA AB 2440", detail: "E-Waste Fee on Battery Products", status: "pending", color: "text-slate-500", bg: "bg-slate-500/10 border-slate-500/20" },
  { label: "NJ EV Battery Act", detail: "Producer Registration 2025", status: "monitoring", color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/20" },
];

const ALERT_ICONS = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertTriangle,
  opportunity: TrendingUp,
};

const ALERT_COLORS = {
  info: "text-blue-600 bg-blue-500/10",
  warning: "text-amber-600 bg-amber-500/10",
  critical: "text-destructive bg-destructive/10",
  opportunity: "text-green-600 bg-green-500/10",
};

function ComplianceResultBadge({ result }: { result: string | null }) {
  if (!result) return <Badge variant="secondary">—</Badge>;
  if (result === "pass") return <Badge variant="default" className="bg-green-600 text-white">Pass</Badge>;
  if (result === "fail") return <Badge variant="destructive">Fail</Badge>;
  if (result === "warning") return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Warning</Badge>;
  return <Badge variant="secondary">Pending</Badge>;
}

export default function ComplianceDashboard() {
  const hasFeature = useHasFeature("compliance_audit");

  const { data: auditLogs, isLoading: auditLoading } = useComplianceAuditLogs();
  const { data: batteries, isLoading: batteriesLoading } = useBatteryInventory();
  const { data: sites, isLoading: sitesLoading } = useCollectionSites();
  const { data: workers, isLoading: workersLoading } = useCollectionWorkers();
  const { data: alerts, isLoading: alertsLoading } = useFlashAlerts();

  const isLoading = auditLoading || batteriesLoading || sitesLoading || workersLoading;

  const totalBatteries = batteries?.length ?? 0;
  const activeSites = sites?.filter((s) => s.status === "active").length ?? 0;
  const openAudits = auditLogs?.filter((a) => a.compliance_result === "pending" || a.compliance_result === null).length ?? 0;
  const certifiedWorkers = workers?.filter((w) => w.training_status === "complete" && w.kyc_status === "approved").length ?? 0;

  const recentAlerts = (alerts ?? []).slice(0, 3);
  const recentAudits = (auditLogs ?? []).slice(0, 10);

  const preview = (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance Dashboard"
        description="Battery recycling regulatory compliance overview"
        icon={ShieldCheck}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!hasFeature) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{preview}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paywall feature="Compliance Dashboard" requiredTier="pro" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance Dashboard"
        description="Battery recycling regulatory compliance overview"
        icon={ShieldCheck}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard
              title="Total Batteries Tracked"
              value={totalBatteries.toLocaleString()}
              icon={Battery}
              variant="primary"
            />
            <KpiCard
              title="Sites Active"
              value={activeSites.toLocaleString()}
              icon={MapPin}
              variant="success"
            />
            <KpiCard
              title="Open Audits"
              value={openAudits.toLocaleString()}
              icon={ClipboardList}
              variant={openAudits > 0 ? "warning" : "default"}
            />
            <KpiCard
              title="Workers Certified"
              value={certifiedWorkers.toLocaleString()}
              icon={Users}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Flash Alerts Summary */}
      <div className="card-premium p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Recent Flash Alerts
        </h2>
        {alertsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : recentAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active alerts</p>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((alert) => {
              const AlertIcon = ALERT_ICONS[alert.type] ?? Info;
              const colorClass = ALERT_COLORS[alert.type] ?? ALERT_COLORS.info;
              return (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className={cn("p-1.5 rounded-lg shrink-0", colorClass)}>
                    <AlertIcon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.title}</p>
                    {alert.message && (
                      <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="card-premium p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Recent Audit Logs
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Entity Type</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Action</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Result</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {auditLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="py-2 px-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                recentAudits.map((log) => (
                  <tr key={log.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                    <td className="py-2.5 px-3 capitalize">{log.entity_type.replace(/_/g, " ")}</td>
                    <td className="py-2.5 px-3 capitalize">{log.action.replace(/_/g, " ")}</td>
                    <td className="py-2.5 px-3">
                      <ComplianceResultBadge result={log.compliance_result} />
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground">
                      {new Date(log.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Status Cards */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Regulatory Status
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {REGULATORY_ITEMS.map((item) => (
            <div key={item.label} className={cn("p-4 rounded-xl border", item.bg)}>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              <span className={cn("mt-2 inline-block text-xs font-medium capitalize", item.color)}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
