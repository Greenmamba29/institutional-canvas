import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Cpu, MessageSquare, Zap, DollarSign, Clock } from "lucide-react";
import type { HermesAnalytics, HermesStatus } from "@/hooks/useHermesConnection";
import { fetchHermes } from "@/hooks/useHermesConnection";

interface Props {
  connectionStatus: HermesStatus;
  version: string | null;
}

const EMPTY: HermesAnalytics = {
  total_sessions: 0,
  total_messages: 0,
  avg_latency_ms: 0,
  tokens_today: 0,
  tokens_month: 0,
  skills_invoked: 0,
  cost_today_usd: 0,
  cost_month_usd: 0,
};

export function HermesOverview({ connectionStatus, version }: Props) {
  const [analytics, setAnalytics] = useState<HermesAnalytics>(EMPTY);

  useEffect(() => {
    if (connectionStatus !== "online") return;
    fetchHermes<HermesAnalytics>("/api/analytics")
      .then(setAnalytics)
      .catch(() => {});
  }, [connectionStatus]);

  const statusColor =
    connectionStatus === "online"  ? "bg-green-500" :
    connectionStatus === "offline" ? "bg-slate-400" :
    connectionStatus === "error"   ? "bg-red-500"   : "bg-yellow-400";

  const stats = [
    { label: "Sessions", value: analytics.total_sessions, icon: MessageSquare, color: "text-blue-500" },
    { label: "Messages", value: analytics.total_messages.toLocaleString(), icon: Activity, color: "text-purple-500" },
    { label: "Avg Latency", value: `${analytics.avg_latency_ms} ms`, icon: Clock, color: "text-yellow-500" },
    { label: "Tokens Today", value: analytics.tokens_today.toLocaleString(), icon: Cpu, color: "text-cyan-500" },
    { label: "Skills Invoked", value: analytics.skills_invoked, icon: Zap, color: "text-orange-500" },
    { label: "Cost Today", value: `$${analytics.cost_today_usd.toFixed(4)}`, icon: DollarSign, color: "text-green-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Server status banner */}
      <Card>
        <CardContent className="flex items-center justify-between pt-4 pb-4">
          <div className="flex items-center gap-3">
            <span className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse ${statusColor}`} />
            <div>
              <p className="font-semibold text-sm">Hermes Agent Server</p>
              <p className="text-xs text-muted-foreground">127.0.0.1:9119{version ? ` · v${version}` : ""}</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`capitalize ${
              connectionStatus === "online" ? "border-green-500 text-green-600" : "border-slate-400 text-slate-500"
            }`}
          >
            {connectionStatus}
          </Badge>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-xl font-bold font-mono">
                {connectionStatus === "online" ? s.value : "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {connectionStatus !== "online" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-4 text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Hermes server not detected.</strong> Start it with{" "}
          <code className="px-1 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 font-mono text-xs">
            hermes serve
          </code>{" "}
          on your local machine — the dashboard connects via{" "}
          <code className="px-1 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 font-mono text-xs">
            127.0.0.1:9119
          </code>.
        </div>
      )}
    </div>
  );
}
