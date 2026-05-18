import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Pause, Play, Trash2 } from "lucide-react";
import { fetchHermes } from "@/hooks/useHermesConnection";
import type { HermesLogEntry, HermesStatus } from "@/hooks/useHermesConnection";

interface Props { connectionStatus: HermesStatus; wsUrl: string }

const LEVEL_STYLE: Record<string, string> = {
  info:  "text-blue-400",
  warn:  "text-yellow-400",
  error: "text-red-400",
  debug: "text-slate-400",
};

const LEVEL_BADGE: Record<string, string> = {
  info:  "border-blue-400 text-blue-500",
  warn:  "border-yellow-400 text-yellow-500",
  error: "border-red-400 text-red-500",
  debug: "border-slate-400 text-slate-500",
};

export function HermesLogs({ connectionStatus, wsUrl }: Props) {
  const [logs, setLogs]         = useState<HermesLogEntry[]>([]);
  const [paused, setPaused]     = useState(false);
  const [filter, setFilter]     = useState<string>("all");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const wsRef                   = useRef<WebSocket | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (connectionStatus !== "online") return;
    setLoading(true);
    try {
      const data = await fetchHermes<HermesLogEntry[]>("/api/logs?limit=200");
      setLogs(data);
    } catch {}
    setLoading(false);
  }, [connectionStatus]);

  // Subscribe to live log stream via WebSocket
  useEffect(() => {
    if (connectionStatus !== "online") return;
    loadSnapshot();

    const ws = new WebSocket(`${wsUrl}/ws/logs`);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      if (paused) return;
      try {
        const entry: HermesLogEntry = JSON.parse(ev.data);
        setLogs((prev) => [...prev.slice(-800), entry]);
      } catch {}
    };
    return () => ws.close();
  }, [connectionStatus, wsUrl]); // eslint-disable-line

  useEffect(() => {
    if (!paused) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, paused]);

  const visible = filter === "all" ? logs : logs.filter((l) => l.level === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold">Live Logs</h3>
          <p className="text-xs text-muted-foreground">Streamed in real-time via WebSocket.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Level filter */}
          <div className="flex gap-1">
            {["all", "info", "warn", "error", "debug"].map((l) => (
              <button
                key={l}
                onClick={() => setFilter(l)}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  filter === l
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadSnapshot} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Log viewer */}
      <div className="rounded-lg border border-border bg-[#0d1117] font-mono text-xs h-[500px] overflow-y-auto p-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
        {visible.length === 0 && (
          <p className="text-slate-500 text-center mt-16">
            {connectionStatus !== "online" ? "Connect Hermes to stream logs." : "No log entries yet."}
          </p>
        )}
        {visible.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 leading-5">
            <span className="text-slate-600 shrink-0">{new Date(entry.ts).toLocaleTimeString()}</span>
            <Badge
              variant="outline"
              className={`shrink-0 h-4 text-[9px] px-1 py-0 ${LEVEL_BADGE[entry.level] ?? ""}`}
            >
              {entry.level}
            </Badge>
            {entry.session && (
              <span className="text-slate-500 shrink-0">[{entry.session.slice(0, 8)}]</span>
            )}
            <span className={LEVEL_STYLE[entry.level] ?? "text-slate-300"}>{entry.msg}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {paused && (
        <p className="text-xs text-yellow-600 text-center">
          Log stream paused — click Resume to continue.
        </p>
      )}
    </div>
  );
}
