import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, RefreshCw, Play, Trash2 } from "lucide-react";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesCronJob, HermesStatus } from "@/hooks/useHermesConnection";

interface Props { connectionStatus: HermesStatus }

export function HermesCronJobs({ connectionStatus }: Props) {
  const [jobs, setJobs]       = useState<HermesCronJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState({ name: "", schedule: "0 * * * *", skill: "" });

  const load = async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const data = await fetchHermes<HermesCronJob[]>("/api/cron");
      setJobs(data);
    } catch { setJobs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionStatus]); // eslint-disable-line

  const toggleJob = async (id: string, enabled: boolean) => {
    try {
      await fetchHermes(`/api/cron/${id}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, enabled } : j)));
    } catch {}
  };

  const runNow = async (id: string) => {
    try { await fetchHermes(`/api/cron/${id}/run`, { method: "POST" }); } catch {}
  };

  const deleteJob = async (id: string) => {
    try {
      await fetchHermes(`/api/cron/${id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch {}
  };

  const addJob = async () => {
    if (!form.name || !form.schedule || !form.skill) return;
    try {
      const created = await fetchHermes<HermesCronJob>("/api/cron", {
        method: "POST",
        body: JSON.stringify({ ...form, enabled: true }),
      });
      setJobs((prev) => [...prev, created]);
      setForm({ name: "", schedule: "0 * * * *", skill: "" });
      setAdding(false);
    } catch {}
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Cron Jobs</h3>
          <p className="text-xs text-muted-foreground">Schedule skills to run automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => setAdding((v) => !v)} disabled={connectionStatus !== "online"}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Job
          </Button>
        </div>
      </div>

      {adding && (
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Job Name</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Daily digest"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cron Schedule</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0 * * * *"
                  value={form.schedule}
                  onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Skill</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g. summarize"
                value={form.skill}
                onChange={(e) => setForm((f) => ({ ...f, skill: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={addJob}>Create Job</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {jobs.length === 0 && !adding && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No cron jobs</p>
            <p className="text-xs text-muted-foreground mt-1">
              {connectionStatus === "online" ? "Schedule a skill to run on a cron." : "Connect to Hermes first."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {jobs.map((j) => (
          <Card key={j.id} className={j.enabled ? "" : "opacity-60"}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{j.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {j.schedule} · skill: {j.skill}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {j.next_run ? `Next: ${new Date(j.next_run).toLocaleString()}` : "Not scheduled"}
                    {j.last_run ? ` · Last: ${new Date(j.last_run).toLocaleString()}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={j.enabled ? "border-green-500 text-green-600" : "border-slate-300 text-slate-500"}
                >
                  {j.enabled ? "Active" : "Paused"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => runNow(j.id)}
                  title="Run now"
                >
                  <Play className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => toggleJob(j.id, !j.enabled)}
                >
                  {j.enabled ? "Pause" : "Resume"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => deleteJob(j.id)}
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
