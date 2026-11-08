// Handler-level tests with the network faked. Remote imports (std serve,
// supabase-js) are mapped to local stubs, so no network access is needed:
//   deno test --allow-env --allow-read --no-check --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/
import { handler } from './serve_stub.ts';
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co'); Deno.env.set('SUPABASE_ANON_KEY', 'anon');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'svc'); Deno.env.set('AIRTABLE_API_KEY', 'pat'); Deno.env.set('AIRTABLE_BASE_ID', 'appX');
// Fake network: auth (user "u1" via token "good"), PostgREST (RLS: user sees only row A), Airtable.
const airtable: { method: string; url: string; body: any }[] = [];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input); const auth = new Headers(init?.headers).get('Authorization');
  if (url.endsWith('/auth/v1/user')) return auth === 'Bearer good' ? new Response(JSON.stringify({ id: 'u1' })) : new Response('{}', { status: 401 });
  if (url.includes('/rest/v1/')) {
    const ids = decodeURIComponent(url).match(/in\.\(([^)]*)\)/)![1].split(',');
    return new Response(JSON.stringify(ids.filter((i) => i === A).map((id) => ({ id, status: 'withdrawn', amount: 100, rfq_id: B, title: 'DB title' }))));
  }
  if (url.startsWith('https://api.airtable.com/')) {
    airtable.push({ method: init!.method!, url, body: init!.body ? JSON.parse(init!.body as string) : null });
    return new Response(JSON.stringify({ records: [{ id: 'rec1' }] }));
  }
  throw new Error('unexpected fetch ' + url);
}) as typeof fetch;
await import('../sync-to-airtable/index.ts');
const call = (token: string | null, body: unknown, origin = 'https://lithiumbuy.com') =>
  handler!(new Request('https://fn/', { method: 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body) }));
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }

Deno.test('anonymous is rejected', async () => { assert((await call(null, { table: 'bids', record: { id: A } })).status === 401, 'anon'); });
Deno.test('user cannot sync server-only tables or delete', async () => {
  assert((await call('good', { table: 'market_prices', record: { id: A } })).status === 403, 'market');
  assert((await call('good', { table: 'bids', action: 'delete', recordId: 'rec1', record: { id: A } })).status === 403, 'delete');
});
Deno.test('user cannot sync a row RLS hides', async () => {
  const n = airtable.length;
  const res = await call('good', { table: 'bids', record: { id: B, amount: 1 } });
  assert(res.status === 403, 'status ' + res.status); assert(airtable.length === n, 'no airtable write');
});
Deno.test('user update upserts the DATABASE row on Bid_ID, ignoring forged fields and recordId', async () => {
  const n = airtable.length;
  const res = await call('good', { table: 'bids', action: 'update', recordId: 'recFORGED', record: { id: A, status: 'accepted', amount: 999999 } });
  const j = await res.json(); assert(res.status === 200 && j.success && j.action === 'upsert', JSON.stringify(j));
  assert(res.headers.get('Access-Control-Allow-Origin') === 'https://lithiumbuy.com', 'cors');
  const w = airtable[n]; assert(w.method === 'PATCH' && !w.url.includes('recFORGED'), w.url);
  assert(JSON.stringify(w.body.performUpsert) === JSON.stringify({ fieldsToMergeOn: ['Bid_ID'] }), JSON.stringify(w.body));
  const f = w.body.records[0].fields; assert(f.Bid_ID === A, 'merge id'); 
  assert(!JSON.stringify(f).includes('999999') && !JSON.stringify(f).includes('accepted'), 'forged values leaked: ' + JSON.stringify(f));
  console.log('bids fields written:', JSON.stringify(f));
});
Deno.test('legacy pre-mapped auction payload resolves via Auction_ID and writes mapped DB fields', async () => {
  const n = airtable.length;
  const res = await call('good', { table: 'auctions', record: { Auction_ID: A, Title: 'forged' } });
  assert(res.status === 200, 'status ' + res.status);
  const f = airtable[n].body.records[0].fields; assert(f.Auction_ID === A && f.Title === 'DB title', JSON.stringify(f));
  assert(JSON.stringify(airtable[n].body.performUpsert.fieldsToMergeOn) === '["Auction_ID"]', 'merge');
});
Deno.test('service role keeps batch + delete abilities', async () => {
  const n = airtable.length;
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: A, title: 't' + i }));
  const res = await call('svc', { table: 'auctions', records: rows });
  assert(res.status === 200, 'batch status'); assert(airtable.length === n + 2, 'two batches of <=10');
  const del = await call('svc', { table: 'bids', action: 'delete', recordId: 'rec9', record: { id: A } });
  assert(del.status === 200 && airtable.at(-1)!.method === 'DELETE' && airtable.at(-1)!.url.endsWith('/rec9'), 'delete');
});
Deno.test('disallowed origin gets no CORS header', async () => {
  const res = await call('good', { table: 'bids', record: { id: A } }, 'https://evil.example');
  assert(res.headers.get('Access-Control-Allow-Origin') === null, 'cors');
});
