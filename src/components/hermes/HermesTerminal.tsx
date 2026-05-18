import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Terminal, RefreshCw, Maximize2, Minimize2 } from "lucide-react";

interface HermesTerminalProps {
  wsUrl: string;
  sessionId?: string;
}

type WsState = "connecting" | "open" | "closed" | "error";

export function HermesTerminal({ wsUrl, sessionId }: HermesTerminalProps) {
  const outputRef  = useRef<HTMLDivElement>(null);
  const wsRef      = useRef<WebSocket | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const [lines, setLines]     = useState<{ text: string; ts: string }[]>([]);
  const [wsState, setWsState] = useState<WsState>("closed");
  const [expanded, setExpanded] = useState(false);
  const [input, setInput]       = useState("");

  const endpoint = sessionId
    ? `${wsUrl}/ws/pty/${sessionId}`
    : `${wsUrl}/ws/pty`;

  const connect = useCallback(() => {
    wsRef.current?.close();
    setLines([]);
    setWsState("connecting");

    const ws = new WebSocket(endpoint);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState("open");
      appendLine("[connected]");
    };

    ws.onmessage = (ev) => {
      appendLine(typeof ev.data === "string" ? ev.data : "[binary frame]");
    };

    ws.onerror = () => setWsState("error");
    ws.onclose = () => {
      setWsState("closed");
      appendLine("[disconnected]");
    };
  }, [endpoint]);

  const appendLine = (text: string) => {
    setLines((prev) => [
      ...prev.slice(-500),
      { text, ts: new Date().toISOString() },
    ]);
    setTimeout(() => {
      outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
    }, 10);
  };

  const sendInput = () => {
    if (!input.trim() || wsState !== "open" || !wsRef.current) return;
    wsRef.current.send(input + "\n");
    appendLine(`> ${input}`);
    setInput("");
  };

  useEffect(() => { return () => wsRef.current?.close(); }, []);

  const stateColor: Record<WsState, string> = {
    connecting: "bg-yellow-500",
    open:       "bg-green-500",
    closed:     "bg-slate-400",
    error:      "bg-red-500",
  };

  return (
    <div
      className={`flex flex-col border border-border rounded-lg bg-[#0d1117] text-green-400 font-mono text-xs transition-all ${
        expanded ? "fixed inset-4 z-50" : "h-80"
      }`}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-300 text-xs font-semibold">
            Hermes PTY {sessionId ? `· ${sessionId.slice(0, 8)}` : "· main"}
          </span>
          <Badge
            variant="outline"
            className={`h-4 text-[9px] border-0 text-white ${stateColor[wsState]}`}
          >
            {wsState}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-white"
            onClick={connect}
            title="Reconnect"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-white"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {lines.length === 0 && wsState === "closed" && (
          <p className="text-slate-500 text-center mt-8">
            Click connect to open a PTY session with the Hermes agent.
          </p>
        )}
        {lines.map((l, i) => (
          <div key={i} className="leading-relaxed whitespace-pre-wrap break-all">
            {l.text}
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/40 bg-[#161b22]">
        {wsState !== "open" ? (
          <Button
            size="sm"
            className="w-full bg-green-700 hover:bg-green-600 text-white text-xs h-7"
            onClick={connect}
          >
            Connect PTY
          </Button>
        ) : (
          <>
            <span className="text-green-500 shrink-0">$</span>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-green-300 placeholder:text-slate-600 text-xs"
              placeholder="Type command…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendInput(); }}
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-green-400 hover:text-white px-2"
              onClick={sendInput}
            >
              Send
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
