import { useState, useEffect, useRef, useCallback } from "react";

const HERMES_BASE = "http://127.0.0.1:9119";
const HERMES_WS   = "ws://127.0.0.1:9119";

export type HermesStatus = "connecting" | "online" | "offline" | "error";

export interface HermesSession {
  id: string;
  name: string;
  model: string;
  created_at: string;
  status: "active" | "idle" | "closed";
  message_count: number;
}

export interface HermesSkill {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  source: string;
}

export interface HermesCronJob {
  id: string;
  name: string;
  schedule: string;
  skill: string;
  last_run: string | null;
  next_run: string | null;
  enabled: boolean;
}

export interface HermesLogEntry {
  ts: string;
  level: "info" | "warn" | "error" | "debug";
  msg: string;
  session?: string;
}

export interface HermesAnalytics {
  total_sessions: number;
  total_messages: number;
  avg_latency_ms: number;
  tokens_today: number;
  tokens_month: number;
  skills_invoked: number;
  cost_today_usd: number;
  cost_month_usd: number;
}

export interface HermesConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt: string;
  tool_use: boolean;
  streaming: boolean;
  log_level: string;
  dashboard_port: number;
  cors_origins: string[];
}

export interface HermesApiKey {
  id: string;
  name: string;
  service: string;
  masked: string;
  created_at: string;
  last_used: string | null;
}

async function fetchHermes<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${HERMES_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function useHermesConnection() {
  const [status, setStatus]       = useState<HermesStatus>("connecting");
  const [version, setVersion]     = useState<string | null>(null);
  const pingRef                   = useRef<ReturnType<typeof setInterval> | null>(null);

  const ping = useCallback(async () => {
    try {
      const data = await fetchHermes<{ version: string; status: string }>("/api/status");
      setVersion(data.version ?? null);
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    ping();
    pingRef.current = setInterval(ping, 10_000);
    return () => { if (pingRef.current) clearInterval(pingRef.current); };
  }, [ping]);

  return { status, version, baseUrl: HERMES_BASE, wsUrl: HERMES_WS, fetchHermes };
}

export { fetchHermes };
