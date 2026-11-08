// Run: deno test --allow-env supabase/functions/_shared/
import { checkUserSyncRequest, chunk, extractRowId, fetchRowsAsUser, USER_SYNC_TABLES } from './sync-policy.ts';
import { isFresh, lastRunAt, minutesSince, recordRun } from './refresh-throttle.ts';

function assert(cond: unknown, msg = 'assertion failed'): asserts cond {
  if (!cond) throw new Error(msg);
}
const eq = (a: unknown, b: unknown) =>
  assert(JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

Deno.test('extractRowId accepts raw and legacy Airtable shapes, rejects non-uuids', () => {
  eq(extractRowId({ id: A }), A);
  eq(extractRowId({ Auction_ID: A, Title: 'x' }), A);
  eq(extractRowId({ Bid_ID: B }), B);
  eq(extractRowId({ id: 'not-a-uuid' }), null);
  eq(extractRowId({ id: `${A}),or(id.neq.0` }), null); // no PostgREST filter injection
  eq(extractRowId(null), null);
});

Deno.test('checkUserSyncRequest: table and action allowlists', () => {
  eq(checkUserSyncRequest({ table: 'market_prices', action: 'create', record: { id: A } }).ok, false);
  eq(checkUserSyncRequest({ table: 'subscriptions', action: 'update', record: { id: A } }).ok, false);
  const del = checkUserSyncRequest({ table: 'bids', action: 'delete', record: { id: A } });
  assert(!del.ok && del.status === 403);
  for (const t of USER_SYNC_TABLES) assert(checkUserSyncRequest({ table: t, action: 'create', record: { id: A } }).ok, t);
});

Deno.test('checkUserSyncRequest: ids required, deduplicated, bounded', () => {
  const missing = checkUserSyncRequest({ table: 'bids', action: 'update', record: { status: 'withdrawn' } });
  assert(!missing.ok && missing.status === 400);
  const empty = checkUserSyncRequest({ table: 'bids', action: 'create', records: [] });
  assert(!empty.ok && empty.status === 400);
  const ok = checkUserSyncRequest({ table: 'auctions', action: 'create', records: [{ id: A }, { Auction_ID: A }, { id: B }] });
  assert(ok.ok); eq(ok.ids, [A, B]);
  const many = checkUserSyncRequest({ table: 'auctions', action: 'create', records: Array.from({ length: 101 }, () => ({ id: A })) });
  assert(!many.ok && many.status === 400);
});

Deno.test('fetchRowsAsUser reads via PostgREST with the user token (RLS applies)', async () => {
  Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co');
  Deno.env.set('SUPABASE_ANON_KEY', 'anon');
  let seenUrl = '';
  let seenAuth = '';
  const fake = (async (input: string | URL | Request, init?: RequestInit) => {
    seenUrl = String(input);
    seenAuth = new Headers(init?.headers).get('Authorization') ?? '';
    return new Response(JSON.stringify([{ id: A }]), { status: 200 });
  }) as typeof fetch;
  const rows = await fetchRowsAsUser('bids', [A, B], 'user-jwt', fake);
  eq(rows, [{ id: A }]);
  eq(seenAuth, 'Bearer user-jwt');
  assert(seenUrl.startsWith('https://proj.supabase.co/rest/v1/bids?select=*&id='), seenUrl);
  assert(decodeURIComponent(seenUrl).endsWith(`in.(${A},${B})`), seenUrl);
  const failing = (async () => new Response('denied', { status: 401 })) as typeof fetch;
  eq(await fetchRowsAsUser('bids', [A], 'bad', failing), null);
});

Deno.test('chunk', () => {
  eq(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  eq(chunk([], 10), []);
});

Deno.test('refresh throttle: isFresh / minutesSince', () => {
  const now = new Date('2026-11-08T12:00:00Z');
  eq(minutesSince('2026-11-08T11:50:00Z', now), 10);
  assert(isFresh('2026-11-08T11:50:00Z', 15, now));
  assert(!isFresh('2026-11-08T11:40:00Z', 15, now));
  assert(!isFresh(null, 15, now));
  assert(!isFresh('garbage', 15, now));
  assert(!isFresh('2026-11-08T12:30:00Z', 15, now)); // future timestamps don't block
});

Deno.test('refresh throttle: lastRunAt / recordRun use webhook_events with service role', async () => {
  Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'svc');
  const calls: { url: string; method: string; body?: string; auth: string | null }[] = [];
  const fake = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), method: init?.method ?? 'GET', body: init?.body as string, auth: new Headers(init?.headers).get('Authorization') });
    return init?.method === 'POST'
      ? new Response(null, { status: 201 })
      : new Response(JSON.stringify([{ created_at: '2026-11-08T11:55:00Z' }]), { status: 200 });
  }) as typeof fetch;
  eq(await lastRunAt('market_intel_ingest', fake), '2026-11-08T11:55:00Z');
  assert(calls[0].url.includes('event_type=eq.market_intel_ingest_run'));
  eq(calls[0].auth, 'Bearer svc');
  await recordRun('market_intel_ingest', 'user', {}, fake);
  eq(calls[1].method, 'POST');
  eq(JSON.parse(calls[1].body!).event_type, 'market_intel_ingest_run');
  eq(JSON.parse(calls[1].body!).payload.trigger, 'user');
});
