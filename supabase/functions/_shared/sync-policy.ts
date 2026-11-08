/**
 * Authorization policy for user-initiated Supabase -> Airtable syncs.
 *
 * A signed-in user may only mirror rows they can read under RLS, in tables the
 * app actually syncs from the browser. The row content written to Airtable is
 * re-read from the database as that user, so client-supplied field values are
 * never trusted. Service-role callers (other edge functions) are not limited.
 *
 * No remote imports, so this module is unit-testable offline.
 */

/** Tables the frontend mirrors to Airtable (create/update only). */
export const USER_SYNC_TABLES: ReadonlySet<string> = new Set([
  'rfqs',
  'bids',
  'deals',
  'purchases',
  'custody_events',
  'telebuy_sessions',
  'auctions',
  'auction_bids',
]);

/** Max records per Airtable write request. */
export const AIRTABLE_BATCH_SIZE = 10;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The Supabase row id carried by a sync payload. Accepts the raw row shape
 * (`id`) and the legacy pre-mapped Airtable shapes the auction sync used to send.
 */
export function extractRowId(record: Record<string, unknown> | null | undefined): string | null {
  if (!record) return null;
  for (const key of ['id', 'Auction_ID', 'Bid_ID', 'Supabase_ID']) {
    const v = record[key];
    if (typeof v === 'string' && UUID_RE.test(v)) return v;
  }
  return null;
}

export type UserSyncDecision =
  | { ok: true; ids: string[] }
  | { ok: false; status: 400 | 403; error: string };

/** Validate a user-initiated sync request before touching the database. */
export function checkUserSyncRequest(req: {
  table: string;
  action: string;
  record?: Record<string, unknown> | null;
  records?: Record<string, unknown>[] | null;
}): UserSyncDecision {
  if (!USER_SYNC_TABLES.has(req.table)) {
    return { ok: false, status: 403, error: `Table ${req.table} can only be synced by the server` };
  }
  if (req.action !== 'create' && req.action !== 'update') {
    return { ok: false, status: 403, error: `Action ${req.action} can only be performed by the server` };
  }
  const payloads = req.records && req.records.length > 0 ? req.records : req.record ? [req.record] : [];
  if (payloads.length === 0) return { ok: false, status: 400, error: 'No record to sync' };
  if (payloads.length > 100) return { ok: false, status: 400, error: 'Too many records (max 100)' };

  const ids: string[] = [];
  for (const p of payloads) {
    const id = extractRowId(p);
    if (!id) return { ok: false, status: 400, error: 'Every record must carry its Supabase row id' };
    ids.push(id);
  }
  return { ok: true, ids: [...new Set(ids)] };
}

type FetchLike = typeof fetch;

/**
 * Read rows by id through PostgREST *as the user* (their JWT + anon key), so
 * RLS decides visibility. Returns null when the read itself failed.
 */
export async function fetchRowsAsUser(
  table: string,
  ids: string[],
  userToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<Record<string, unknown>[] | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) return null;
  const filter = `in.(${ids.join(',')})`;
  try {
    const res = await fetchImpl(
      `${url}/rest/v1/${encodeURIComponent(table)}?select=*&id=${encodeURIComponent(filter)}`,
      { headers: { apikey: anon, Authorization: `Bearer ${userToken}`, Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) ? rows : null;
  } catch {
    return null;
  }
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
