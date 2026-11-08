// Run: deno test --allow-env supabase/functions/_shared/security.test.ts
import {
  hmacSha256Hex,
  isAllowedOrigin,
  requireAdminOrService,
  requireCronOrService,
  requireSharedSecret,
  requireUserOrService,
  timingSafeEqual,
  verifyWebhookSecret,
  withCors,
} from './security.ts';

function assert(cond: unknown, msg = 'assertion failed'): asserts cond {
  if (!cond) throw new Error(msg);
}
const assertEquals = (a: unknown, b: unknown) =>
  assert(JSON.stringify(a) === JSON.stringify(b), `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);

const SERVICE = 'service-role-key-123';
function resetEnv() {
  for (const k of ['CRON_SECRET', 'TEST_WEBHOOK_SECRET', 'ALLOWED_ORIGINS']) Deno.env.delete(k);
  Deno.env.set('SUPABASE_URL', 'https://proj.supabase.co');
  Deno.env.set('SUPABASE_ANON_KEY', 'anon');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', SERVICE);
}
const req = (headers: Record<string, string> = {}) => new Request('https://fn.test/', { method: 'POST', headers });

// Fake Auth/REST API: token "good" is a normal user, "admin" is a super admin.
const fakeFetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  const auth = new Headers(init?.headers).get('Authorization');
  if (url.endsWith('/auth/v1/user')) {
    if (auth === 'Bearer good' || auth === 'Bearer admin') return new Response(JSON.stringify({ id: 'u1' }), { status: 200 });
    return new Response('{}', { status: 401 });
  }
  if (url.endsWith('/rest/v1/rpc/is_super_admin')) return new Response(JSON.stringify(auth === 'Bearer admin'), { status: 200 });
  return new Response('not found', { status: 404 });
}) as typeof fetch;

Deno.test('timingSafeEqual', () => {
  assert(timingSafeEqual('abc', 'abc'));
  assert(!timingSafeEqual('abc', 'abd'));
  assert(!timingSafeEqual('abc', 'abcd'));
  assert(!timingSafeEqual('', 'a'));
});

Deno.test('requireCronOrService fails closed when CRON_SECRET is unset', () => {
  resetEnv();
  assertEquals((requireCronOrService(req()) as Response).status, 401);
  assertEquals((requireCronOrService(req({ 'x-cron-secret': 'anything' })) as Response).status, 503);
  assertEquals(requireCronOrService(req({ Authorization: `Bearer ${SERVICE}` })), true);
});

Deno.test('requireCronOrService checks the secret when set', () => {
  resetEnv();
  Deno.env.set('CRON_SECRET', 's3cret');
  assertEquals(requireCronOrService(req({ 'x-cron-secret': 's3cret' })), true);
  assertEquals((requireCronOrService(req({ 'x-cron-secret': 'wrong' })) as Response).status, 401);
  assertEquals((requireCronOrService(req()) as Response).status, 401);
  assertEquals((requireCronOrService(req({ Authorization: 'Bearer not-service' })) as Response).status, 401);
});

Deno.test('requireSharedSecret fails closed and accepts any listed header', () => {
  resetEnv();
  assertEquals((requireSharedSecret(req({ 'x-webhook-token': 'x' }), 'TEST_WEBHOOK_SECRET', ['x-webhook-token']) as Response).status, 503);
  Deno.env.set('TEST_WEBHOOK_SECRET', 'tok');
  const headers = ['x-webhook-token', 'x-airtable-signature'];
  assertEquals(requireSharedSecret(req({ 'x-webhook-token': 'tok' }), 'TEST_WEBHOOK_SECRET', headers), true);
  assertEquals(requireSharedSecret(req({ 'x-airtable-signature': 'tok' }), 'TEST_WEBHOOK_SECRET', headers), true);
  assertEquals((requireSharedSecret(req({ 'x-webhook-token': 'nope' }), 'TEST_WEBHOOK_SECRET', headers) as Response).status, 401);
  assertEquals((requireSharedSecret(req(), 'TEST_WEBHOOK_SECRET', headers) as Response).status, 401);
});

Deno.test('requireUserOrService', async () => {
  resetEnv();
  assertEquals(await requireUserOrService(req({ Authorization: `Bearer ${SERVICE}` }), fakeFetch), { kind: 'service' });
  const user = await requireUserOrService(req({ Authorization: 'Bearer good' }), fakeFetch);
  assert(!(user instanceof Response) && user.kind === 'user');
  assertEquals(((await requireUserOrService(req({ Authorization: 'Bearer bad' }), fakeFetch)) as Response).status, 401);
  assertEquals(((await requireUserOrService(req(), fakeFetch)) as Response).status, 401);
});

Deno.test('requireAdminOrService', async () => {
  resetEnv();
  assertEquals(await requireAdminOrService(req({ Authorization: `Bearer ${SERVICE}` }), fakeFetch), { kind: 'service' });
  const admin = await requireAdminOrService(req({ Authorization: 'Bearer admin' }), fakeFetch);
  assert(!(admin instanceof Response));
  assertEquals(((await requireAdminOrService(req({ Authorization: 'Bearer good' }), fakeFetch)) as Response).status, 403);
  assertEquals(((await requireAdminOrService(req(), fakeFetch)) as Response).status, 401);
});

Deno.test('isAllowedOrigin', () => {
  resetEnv();
  assert(isAllowedOrigin('https://lithiumbuy.com'));
  assert(isAllowedOrigin('https://www.lithiumbuy.com'));
  assert(!isAllowedOrigin('https://evil.com'));
  assert(!isAllowedOrigin('https://lithiumbuy.com.evil.com'));
  assert(!isAllowedOrigin(null));
  Deno.env.set('ALLOWED_ORIGINS', 'https://*.vercel.app, https://staging.lithiumbuy.com');
  assert(isAllowedOrigin('https://lithiumbuy-git-main.vercel.app'));
  assert(isAllowedOrigin('https://staging.lithiumbuy.com'));
  assert(!isAllowedOrigin('http://x.vercel.app'));
  assert(!isAllowedOrigin('https://vercel.app.evil.com'));
});

Deno.test('withCors echoes only allowed origins and strips wildcards', async () => {
  resetEnv();
  const handler = withCors(() => new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } }));
  const ok = await handler(new Request('https://fn.test/', { headers: { Origin: 'https://lithiumbuy.com' } }));
  assertEquals(ok.headers.get('Access-Control-Allow-Origin'), 'https://lithiumbuy.com');
  const bad = await handler(new Request('https://fn.test/', { headers: { Origin: 'https://evil.com' } }));
  assertEquals(bad.headers.get('Access-Control-Allow-Origin'), null);
  const none = await handler(new Request('https://fn.test/'));
  assertEquals(none.headers.get('Access-Control-Allow-Origin'), null);
  assertEquals(await ok.text(), 'ok');
});

Deno.test('hmacSha256Hex matches a known vector', async () => {
  // RFC 4231 test case 2
  assertEquals(
    await hmacSha256Hex('Jefe', 'what do ya want for nothing?'),
    '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
  );
});

Deno.test('verifyWebhookSecret: headers, body _secret (stripped), fail closed', () => {
  resetEnv();
  const mk = (body: unknown, headers: Record<string, string> = {}) =>
    [new Request('https://fn.test/', { method: 'POST', headers }), JSON.stringify(body)] as const;
  const unset = verifyWebhookSecret(...mk({ _secret: 'x' }), 'TEST_WEBHOOK_SECRET');
  assert(!unset.ok && unset.response.status === 503);
  Deno.env.set('TEST_WEBHOOK_SECRET', 'tok');
  const viaBody = verifyWebhookSecret(...mk({ _secret: 'tok', table: 't' }), 'TEST_WEBHOOK_SECRET');
  assert(viaBody.ok); assertEquals(viaBody.body, { table: 't' });
  assert(verifyWebhookSecret(...mk({ a: 1 }, { 'x-webhook-secret': 'tok' }), 'TEST_WEBHOOK_SECRET').ok);
  assert(verifyWebhookSecret(...mk({ a: 1 }, { 'x-webhook-token': 'tok' }), 'TEST_WEBHOOK_SECRET').ok);
  assert(verifyWebhookSecret(...mk({ a: 1 }, { 'x-extra': 'tok' }), 'TEST_WEBHOOK_SECRET', ['x-extra']).ok);
  const wrong = verifyWebhookSecret(...mk({ _secret: 'nope' }), 'TEST_WEBHOOK_SECRET');
  assert(!wrong.ok && wrong.response.status === 401);
  const notJson = verifyWebhookSecret(new Request('https://fn.test/', { method: 'POST', headers: { 'x-webhook-token': 'tok' } }), 'not json', 'TEST_WEBHOOK_SECRET');
  assert(!notJson.ok && notJson.response.status === 400);
});
