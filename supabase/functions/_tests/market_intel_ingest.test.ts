// Handler-level tests with the network faked. Remote imports (std serve,
// supabase-js) are mapped to local stubs, so no network access is needed:
//   deno test --allow-env --allow-read --no-check --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/
import { handler } from './serve_stub.ts';
Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co'); Deno.env.set('SUPABASE_ANON_KEY', 'anon');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'svc'); Deno.env.set('FIRECRAWL_API_KEY', 'fc'); Deno.env.set('CRON_SECRET', 'cron');
let lastRun: string | null = null; let firecrawlCalls = 0; let runsRecorded = 0;
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input); const auth = new Headers(init?.headers).get('Authorization');
  if (url.endsWith('/auth/v1/user')) return auth === 'Bearer good' ? new Response(JSON.stringify({ id: 'u1' })) : new Response('{}', { status: 401 });
  if (url.includes('/rest/v1/webhook_events')) {
    if ((init?.method ?? 'GET') === 'POST') { runsRecorded++; lastRun = new Date().toISOString(); return new Response(null, { status: 201 }); }
    return new Response(JSON.stringify(lastRun ? [{ created_at: lastRun }] : []));
  }
  if (url.includes('firecrawl.dev')) { firecrawlCalls++; return new Response(JSON.stringify({ success: true, data: { markdown: '' } })); }
  if (url.includes('/rest/v1/')) return new Response('[]', { status: 200 });
  return new Response('', { status: 200 }); // RSS, FX etc.
}) as typeof fetch;
await import('../market-intel-ingest/index.ts');
const call = (headers: Record<string, string>) => handler!(new Request('https://fn/', { method: 'POST', headers }));
function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
Deno.test('anonymous rejected', async () => { assert((await call({})).status === 401, 'anon'); });
Deno.test('first user refresh runs, second within 15 min is skipped without Firecrawl spend', async () => {
  const r1 = await (await call({ Authorization: 'Bearer good' })).json();
  assert(r1.ok && !r1.skipped && runsRecorded === 1, JSON.stringify(r1));
  const spent = firecrawlCalls; assert(spent > 0, 'first run used firecrawl');
  const r2 = await (await call({ Authorization: 'Bearer good' })).json();
  assert(r2.ok && r2.skipped === true && firecrawlCalls === spent && runsRecorded === 1, JSON.stringify(r2));
});
Deno.test('cron is never throttled', async () => {
  const before = runsRecorded; const res = await call({ 'x-cron-secret': 'cron' }); const j = await res.json();
  assert(res.status === 200 && !j.skipped && runsRecorded === before + 1, JSON.stringify(j));
});
Deno.test('stale last run lets a user refresh again', async () => {
  lastRun = new Date(Date.now() - 20 * 60000).toISOString();
  const j = await (await call({ Authorization: 'Bearer good' })).json(); assert(j.ok && !j.skipped, JSON.stringify(j));
});
