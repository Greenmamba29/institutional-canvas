/**
 * Throttle for user-triggered refreshes of shared, paid data sources
 * (e.g. market-intel-ingest, which spends Firecrawl credits).
 *
 * The last run time is read from public.webhook_events, where each run is
 * recorded with event_type = `${jobName}_run`. Scheduled (cron/service) runs
 * are never throttled; signed-in users are, across all users combined.
 *
 * No remote imports, so this module is unit-testable offline.
 */

type FetchLike = typeof fetch;

export function minutesSince(iso: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? (now.getTime() - t) / 60000 : null;
}

/** True when the last run is recent enough that a user refresh should be skipped. */
export function isFresh(lastRunIso: string | null, minMinutes: number, now: Date = new Date()): boolean {
  const age = minutesSince(lastRunIso, now);
  return age !== null && age >= 0 && age < minMinutes;
}

function serviceHeaders(): Record<string, string> | null {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return key ? { apikey: key, Authorization: `Bearer ${key}` } : null;
}

/** created_at of the most recent recorded run of `jobName`, or null. */
export async function lastRunAt(jobName: string, fetchImpl: FetchLike = fetch): Promise<string | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const headers = serviceHeaders();
  if (!url || !headers) return null;
  const qs = new URLSearchParams({
    select: 'created_at',
    event_type: `eq.${jobName}_run`,
    order: 'created_at.desc',
    limit: '1',
  });
  try {
    const res = await fetchImpl(`${url}/rest/v1/webhook_events?${qs}`, { headers });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows[0]?.created_at ? String(rows[0].created_at) : null;
  } catch {
    return null;
  }
}

/** Record that `jobName` ran (best-effort). */
export async function recordRun(
  jobName: string,
  trigger: 'cron' | 'service' | 'user',
  payload: Record<string, unknown> = {},
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  const url = Deno.env.get('SUPABASE_URL');
  const headers = serviceHeaders();
  if (!url || !headers) return;
  try {
    await fetchImpl(`${url}/rest/v1/webhook_events`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        event_type: `${jobName}_run`,
        source: jobName,
        status: 'started',
        payload: { trigger, ...payload },
      }),
    });
  } catch {
    // best-effort
  }
}
