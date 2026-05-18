import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, RefreshCw, ToggleLeft, ToggleRight, ExternalLink } from "lucide-react";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesSkill, HermesStatus } from "@/hooks/useHermesConnection";

interface Props { connectionStatus: HermesStatus }

export function HermesSkills({ connectionStatus }: Props) {
  const [skills, setSkills]   = useState<HermesSkill[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const data = await fetchHermes<HermesSkill[]>("/api/skills");
      setSkills(data);
    } catch { setSkills([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionStatus]); // eslint-disable-line

  const toggle = async (name: string, enabled: boolean) => {
    try {
      await fetchHermes(`/api/skills/${encodeURIComponent(name)}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      setSkills((prev) => prev.map((s) => (s.name === name ? { ...s, enabled } : s)));
    } catch {}
  };

  const grouped = skills.reduce<Record<string, HermesSkill[]>>((acc, s) => {
    const key = s.source ?? "custom";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Skills</h3>
          <p className="text-xs text-muted-foreground">
            Install skills with{" "}
            <code className="px-1 py-0.5 bg-muted rounded font-mono text-[11px]">
              npx skills add &lt;org/skill&gt;
            </code>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {skills.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No skills installed</p>
            <p className="text-xs text-muted-foreground mt-1">
              {connectionStatus === "online"
                ? "Run npx skills add <name> to install a skill."
                : "Connect to Hermes to view installed skills."}
            </p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([source, group]) => (
        <div key={source}>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {source}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.map((skill) => (
              <Card key={skill.name} className={skill.enabled ? "" : "opacity-60"}>
                <CardHeader className="p-3 pb-1 flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{skill.name}</CardTitle>
                    <CardDescription className="text-[11px] mt-0.5">v{skill.version}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        skill.enabled
                          ? "border-green-500 text-green-600"
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      {skill.enabled ? "On" : "Off"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggle(skill.name, !skill.enabled)}
                      disabled={connectionStatus !== "online"}
                      title={skill.enabled ? "Disable skill" : "Enable skill"}
                    >
                      {skill.enabled
                        ? <ToggleRight className="h-4 w-4 text-green-500" />
                        : <ToggleLeft className="h-4 w-4 text-slate-400" />
                      }
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {skill.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Install hint */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-center justify-between py-3 px-4">
          <div>
            <p className="text-sm font-medium">Browse the Skills Registry</p>
            <p className="text-xs text-muted-foreground">Discover official and community skills.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="https://github.com/NousResearch/hermes-skills" target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Registry
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
