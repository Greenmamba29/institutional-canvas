// Handler-level tests with the network faked. Remote imports (std serve,
// supabase-js) are mapped to local stubs, so no network access is needed:
//   deno test --allow-env --allow-read --no-check --import-map=supabase/functions/_tests/import_map.json supabase/functions/_tests/
import { handler } from './serve_stub.ts';
import { writes } from './supabase_stub.ts';

const SECRET = 'whsec-test-123';
Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co');
Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'svc');
Deno.env.set('AIRTABLE_WEBHOOK_SECRET', SECRET);

const logs: string[] = [];
const origLog = console.log;
console.log = (...a: unknown[]) => { logs.push(a.map(String).join(' ')); };
await import('../airtable-market-webhook/index.ts');
console.log = origLog;

function assert(c: unknown, m: string): asserts c { if (!c) throw new Error(m); }
const post = (body: unknown, headers: Record<string, string> = {}) =>
  handler!(new Request('https://fn/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer anon', apikey: 'anon', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }));

// Shape sent by the live Airtable "Run a script" automations (airtable-automations/*.js).
const scriptPayload = { _secret: SECRET, table: 'Market Prices', action: 'create', record: { 'Product Type': 'Lithium Carbonate', 'Price (USD)': 10500 } };

Deno.test('body _secret from Airtable scripts is accepted and never stored or logged', async () => {
  const before = writes.length;
  logs.length = 0;
  console.log = (...a: unknown[]) => { logs.push(a.map(String).join(' ')); };
  const res = await post(scriptPayload);
  console.log = origLog;
  assert(res.status === 200, 'status ' + res.status);
  const newWrites = writes.slice(before);
  assert(newWrites.some((w) => w.table === 'market_prices' && w.op === 'insert'), 'price inserted');
  const all = JSON.stringify(newWrites) + logs.join('\n');
  assert(!all.includes(SECRET), 'secret leaked into storage/logs');
});

Deno.test('x-webhook-secret and x-webhook-token headers are accepted', async () => {
  const { _secret, ...rest } = scriptPayload;
  assert((await post(rest, { 'x-webhook-secret': SECRET })).status === 200, 'x-webhook-secret');
  assert((await post(rest, { 'x-webhook-token': SECRET })).status === 200, 'x-webhook-token');
  void _secret;
});

Deno.test('wrong or missing secret is rejected without writing', async () => {
  const before = writes.length;
  assert((await post({ ...scriptPayload, _secret: 'wrong' })).status === 401, 'wrong body secret');
  const { _secret, ...rest } = scriptPayload;
  void _secret;
  assert((await post(rest)).status === 401, 'missing');
  assert(writes.length === before, 'no writes on rejection');
});

Deno.test('fails closed when the secret is not configured', async () => {
  Deno.env.delete('AIRTABLE_WEBHOOK_SECRET');
  try {
    assert((await post(scriptPayload)).status === 503, 'unset secret');
  } finally {
    Deno.env.set('AIRTABLE_WEBHOOK_SECRET', SECRET);
  }
});
