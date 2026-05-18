import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesApiKey, HermesStatus } from "@/hooks/useHermesConnection";

interface Props { connectionStatus: HermesStatus }

export function HermesApiKeys({ connectionStatus }: Props) {
  const [keys, setKeys]       = useState<HermesApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState({ name: "", service: "", value: "" });

  const load = async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const data = await fetchHermes<HermesApiKey[]>("/api/keys");
      setKeys(data);
    } catch { setKeys([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionStatus]); // eslint-disable-line

  const deleteKey = async (id: string) => {
    try {
      await fetchHermes(`/api/keys/${id}`, { method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch {}
  };

  const addKey = async () => {
    if (!form.name || !form.service || !form.value) return;
    try {
      const created = await fetchHermes<HermesApiKey>("/api/keys", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setKeys((prev) => [...prev, created]);
      setForm({ name: "", service: "", value: "" });
      setAdding(false);
    } catch {}
  };

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const serviceColor: Record<string, string> = {
    openai: "bg-emerald-100 text-emerald-700 border-emerald-200",
    anthropic: "bg-amber-100 text-amber-700 border-amber-200",
    groq: "bg-purple-100 text-purple-700 border-purple-200",
    together: "bg-blue-100 text-blue-700 border-blue-200",
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">API Keys</h3>
          <p className="text-xs text-muted-foreground">
            Keys are stored encrypted in the Hermes vault on your machine.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setAdding((v) => !v)} disabled={connectionStatus !== "online"}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Key
          </Button>
        </div>
      </div>

      {adding && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Name</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Production Anthropic"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Service</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.service}
                  onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                >
                  <option value="">Select service…</option>
                  <option>anthropic</option>
                  <option>openai</option>
                  <option>groq</option>
                  <option>together</option>
                  <option>custom</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Key Value</label>
              <input
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="sk-…"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={addKey}>Save Key</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {keys.length === 0 && !adding && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Key className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No API keys configured</p>
            <p className="text-xs text-muted-foreground mt-1">
              {connectionStatus === "online" ? "Add a key to get started." : "Connect to Hermes to manage keys."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {keys.map((k) => (
          <Card key={k.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3 min-w-0">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {revealed.has(k.id) ? k.masked : k.masked.replace(/[^•·]/g, "•")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${serviceColor[k.service] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                >
                  {k.service}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleReveal(k.id)}
                >
                  {revealed.has(k.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteKey(k.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
