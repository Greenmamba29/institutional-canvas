import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  LayoutDashboard,
  Settings2,
  Key,
  MessageSquare,
  ScrollText,
  BarChart2,
  Clock,
  Zap,
} from "lucide-react";
import { useHermesConnection } from "@/hooks/useHermesConnection";
import { HermesOverview }  from "@/components/hermes/HermesOverview";
import { HermesConfig }    from "@/components/hermes/HermesConfig";
import { HermesApiKeys }   from "@/components/hermes/HermesApiKeys";
import { HermesSessions }  from "@/components/hermes/HermesSessions";
import { HermesLogs }      from "@/components/hermes/HermesLogs";
import { HermesCronJobs }  from "@/components/hermes/HermesCronJobs";
import { HermesSkills }    from "@/components/hermes/HermesSkills";
import { HermesTerminal }  from "@/components/hermes/HermesTerminal";

const STATUS_DOT: Record<string, string> = {
  online:     "bg-green-500",
  offline:    "bg-slate-400",
  connecting: "bg-yellow-400 animate-pulse",
  error:      "bg-red-500",
};

export default function HermesDashboard() {
  const { status: connectionStatus, version, wsUrl } = useHermesConnection();

  const tabs = [
    { value: "overview",  label: "Overview",  icon: LayoutDashboard },
    { value: "sessions",  label: "Sessions",  icon: MessageSquare },
    { value: "logs",      label: "Logs",      icon: ScrollText },
    { value: "config",    label: "Config",    icon: Settings2 },
    { value: "api-keys",  label: "API Keys",  icon: Key },
    { value: "analytics", label: "Analytics", icon: BarChart2 },
    { value: "cron",      label: "Cron Jobs", icon: Clock },
    { value: "skills",    label: "Skills",    icon: Zap },
    { value: "terminal",  label: "Terminal",  icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hermes Dashboard"
        description="NousResearch Hermes agent — config, sessions, logs, skills & PTY terminal."
        actions={
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[connectionStatus]}`} />
            <Badge
              variant="outline"
              className={
                connectionStatus === "online"
                  ? "border-green-500 text-green-600"
                  : "border-slate-300 text-muted-foreground"
              }
            >
              {connectionStatus === "online" && version ? `v${version}` : connectionStatus}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">127.0.0.1:9119</span>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1 bg-muted/50">
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="gap-1.5 text-xs">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <HermesOverview connectionStatus={connectionStatus} version={version} />
        </TabsContent>

        <TabsContent value="sessions">
          <HermesSessions connectionStatus={connectionStatus} wsUrl={wsUrl} />
        </TabsContent>

        <TabsContent value="logs">
          <HermesLogs connectionStatus={connectionStatus} wsUrl={wsUrl} />
        </TabsContent>

        <TabsContent value="config">
          <HermesConfig connectionStatus={connectionStatus} />
        </TabsContent>

        <TabsContent value="api-keys">
          <HermesApiKeys connectionStatus={connectionStatus} />
        </TabsContent>

        <TabsContent value="analytics">
          {/* Analytics re-uses Overview metrics — a deeper chart view */}
          <HermesOverview connectionStatus={connectionStatus} version={version} />
        </TabsContent>

        <TabsContent value="cron">
          <HermesCronJobs connectionStatus={connectionStatus} />
        </TabsContent>

        <TabsContent value="skills">
          <HermesSkills connectionStatus={connectionStatus} />
        </TabsContent>

        <TabsContent value="terminal">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Full PTY session — exposes the Hermes TUI in-browser via WebSocket.
            </p>
            <HermesTerminal wsUrl={wsUrl} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
