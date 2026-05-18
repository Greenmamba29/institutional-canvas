import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw } from "lucide-react";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesConfig as HermesConfigType, HermesStatus } from "@/hooks/useHermesConnection";

const DEFAULTS: HermesConfigType = {
  model: "NousResearch/Hermes-3-Llama-3.1-70B",
  temperature: 0.7,
  max_tokens: 4096,
  system_prompt: "You are Hermes, a helpful AI assistant.",
  tool_use: true,
  streaming: true,
  log_level: "info",
  dashboard_port: 9119,
  cors_origins: ["http://localhost:5173"],
};

interface Props { connectionStatus: HermesStatus }

export function HermesConfig({ connectionStatus }: Props) {
  const [config, setConfig]   = useState<HermesConfigType>(DEFAULTS);
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const c = await fetchHermes<HermesConfigType>("/api/config");
      setConfig(c);
      setDirty(false);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = <K extends keyof HermesConfigType>(key: K, value: HermesConfigType[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await fetchHermes("/api/config", { method: "PUT", body: JSON.stringify(config) });
      setDirty(false);
    } catch {}
    setSaving(false);
  };

  const field = (label: string, key: keyof HermesConfigType, type: "text" | "number" | "textarea" = "text") => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
      {type === "textarea" ? (
        <textarea
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring resize-y"
          value={config[key] as string}
          onChange={(e) => update(key, e.target.value as HermesConfigType[typeof key])}
          disabled={connectionStatus !== "online"}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          value={config[key] as string | number}
          onChange={(e) =>
            update(key, (type === "number" ? Number(e.target.value) : e.target.value) as HermesConfigType[typeof key])
          }
          disabled={connectionStatus !== "online"}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Agent Configuration</h3>
          <p className="text-xs text-muted-foreground">Changes are written to hermes.config.json on save.</p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <Badge variant="outline" className="text-yellow-600 border-yellow-400">Unsaved</Badge>}
          <Button variant="outline" size="sm" onClick={load} disabled={loading || connectionStatus !== "online"}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Reload
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty || saving || connectionStatus !== "online"}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {field("Model ID", "model")}
          <div className="grid grid-cols-2 gap-3">
            {field("Temperature", "temperature", "number")}
            {field("Max Tokens", "max_tokens", "number")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">System Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          {field("Prompt", "system_prompt", "textarea")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Server</CardTitle>
          <CardDescription className="text-xs">Runtime and network settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {field("Dashboard Port", "dashboard_port", "number")}
            {field("Log Level", "log_level")}
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.tool_use}
                onChange={(e) => update("tool_use", e.target.checked)}
                disabled={connectionStatus !== "online"}
                className="rounded"
              />
              Tool Use
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.streaming}
                onChange={(e) => update("streaming", e.target.checked)}
                disabled={connectionStatus !== "online"}
                className="rounded"
              />
              Streaming
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
