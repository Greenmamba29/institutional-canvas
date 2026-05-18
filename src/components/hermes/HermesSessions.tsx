import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, RefreshCw, Terminal } from "lucide-react";
import { HermesTerminal } from "./HermesTerminal";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesSession, HermesStatus } from "@/hooks/useHermesConnection";

interface Props { connectionStatus: HermesStatus; wsUrl: string }

export function HermesSessions({ connectionStatus, wsUrl }: Props) {
  const [sessions, setSessions]         = useState<HermesSession[]>([]);
  const [selected, setSelected]         = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [loading, setLoading]           = useState(false);

  const load = async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const data = await fetchHermes<HermesSession[]>("/api/sessions");
      setSessions(data);
    } catch { setSessions([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [connectionStatus]); // eslint-disable-line

  const createSession = async () => {
    try {
      const s = await fetchHermes<HermesSession>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ name: `Session ${Date.now()}` }),
      });
      setSessions((prev) => [s, ...prev]);
      setSelected(s.id);
    } catch {}
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-500 text-white border-green-500",
    idle:   "bg-yellow-400 text-white border-yellow-400",
    closed: "bg-slate-300 text-slate-700 border-slate-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Sessions</h3>
          <p className="text-xs text-muted-foreground">Each session holds its own context window.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setSelected(null); setShowTerminal((v) => !v); }}
            disabled={connectionStatus !== "online"}
          >
            <Terminal className="h-3.5 w-3.5 mr-1.5" />
            PTY Terminal
          </Button>
          <Button size="sm" onClick={createSession} disabled={connectionStatus !== "online"}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Session
          </Button>
        </div>
      </div>

      {showTerminal && (
        <HermesTerminal wsUrl={wsUrl} sessionId={selected ?? undefined} />
      )}

      {sessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No sessions</p>
            <p className="text-xs text-muted-foreground mt-1">
              {connectionStatus === "online" ? "Create a new session to start chatting." : "Connect to Hermes first."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {sessions.map((s) => (
          <Card
            key={s.id}
            className={`cursor-pointer transition-colors ${
              selected === s.id ? "border-primary/50 bg-primary/5" : "hover:bg-secondary/30"
            }`}
            onClick={() => { setSelected(s.id); setShowTerminal(true); }}
          >
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.model} · {s.message_count} msgs · {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${statusColor[s.status] ?? ""}`}>
                  {s.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); setSelected(s.id); setShowTerminal(true); }}
                  title="Open PTY"
                >
                  <Terminal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
