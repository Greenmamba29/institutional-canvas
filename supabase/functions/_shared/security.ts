/**
 * Shared security helpers for edge functions.
 *
 * Every check here FAILS CLOSED: if the secret or key a check depends on is
 * not configured, the request is rejected rather than allowed through.
 *
 * No remote imports on purpose, so this module can be unit-tested offline
 * (see security.test.ts) and cannot be affected by a CDN outage.
 */

// ---------------------------------------------------------------------------
// Constant-time comparison
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

/** Compare two strings in time independent of where they first differ. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  // Always walk the longer buffer so length differences don't short-circuit.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

const unauthorized = (message = 'Unauthorized') => jsonResponse({ error: message }, 401);
const forbidden = (message = 'Forbidden') => jsonResponse({ error: message }, 403);
const notConfigured = (what: string) => {
  console.error(`[security] ${what} is not configured; rejecting request (fail closed)`);
  return jsonResponse({ error: 'Service not configured' }, 503);
};

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const DEFAULT_ALLOWED_ORIGINS = [
  'https://lithiumbuy.com',
  'https://www.lithiumbuy.com',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

/**
 * Allowed browser origins: the defaults above plus a comma-separated
 * ALLOWED_ORIGINS secret. Entries may be exact origins
 * ("https://staging.lithiumbuy.com") or a host suffix wildcard
 * ("https://*.vercel.app") for preview deployments.
 */
export function getAllowedOrigins(): string[] {
  const extra = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return [...DEFAULT_ALLOWED_ORIGINS, ...extra];
}

export function isAllowedOrigin(origin: string | null, allowed = getAllowedOrigins()): boolean {
  if (!origin) return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  return allowed.some((entry) => {
    if (!entry.includes('*')) return entry === origin;
    const m = entry.match(/^(https?):\/\/\*\.(.+)$/);
    if (!m) return false;
    const [, scheme, suffix] = m;
    return url.protocol === `${scheme}:` && url.hostname.endsWith(`.${suffix}`);
  });
}

/**
 * Wrap a handler so every response (including errors and preflights) carries
 * an Access-Control-Allow-Origin that echoes the caller's origin only when it
 * is on the allowlist. Any wildcard ACAO the handler set is removed.
 */
export function withCors(handler: (req: Request) => Response | Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const res = await handler(req);
    const headers = new Headers(res.headers);
    const origin = req.headers.get('Origin');
    headers.delete('Access-Control-Allow-Origin');
    if (isAllowedOrigin(origin)) {
      headers.set('Access-Control-Allow-Origin', origin!);
    }
    const vary = headers.get('Vary');
    headers.set('Vary', vary ? `${vary}, Origin` : 'Origin');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  };
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/** True when the request carries this project's service-role key as its bearer token. */
export function isServiceRoleRequest(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const token = getBearerToken(req);
  return serviceKey.length > 0 && token !== null && timingSafeEqual(token, serviceKey);
}

export interface AuthUser {
  id: string;
  email?: string;
}

type FetchLike = typeof fetch;

/** Resolve the user behind a JWT via the Supabase Auth REST API. Null if invalid. */
export async function getUserFromToken(token: string, fetchImpl: FetchLike = fetch): Promise<AuthUser | null> {
  const url = Deno.env.get('SUPABASE_URL');
  const apikey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !apikey) return null;
  try {
    const res = await fetchImpl(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.id ? { id: body.id, email: body.email } : null;
  } catch {
    return null;
  }
}

/** Ask the database (as the user) whether they are a platform super admin. */
export async function isSuperAdmin(token: string, fetchImpl: FetchLike = fetch): Promise<boolean> {
  const url = Deno.env.get('SUPABASE_URL');
  const apikey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !apikey) return false;
  try {
    const res = await fetchImpl(`${url}/rest/v1/rpc/is_super_admin`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, apikey, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!res.ok) return false;
    return (await res.json()) === true;
  } catch {
    return false;
  }
}

export type Caller = { kind: 'service' } | { kind: 'user'; user: AuthUser; token: string };

/**
 * Allow the service role (server-to-server) or any signed-in user.
 * Returns the caller, or a 401 Response to return immediately.
 */
export async function requireUserOrService(req: Request, fetchImpl: FetchLike = fetch): Promise<Caller | Response> {
  if (isServiceRoleRequest(req)) return { kind: 'service' };
  const token = getBearerToken(req);
  if (!token) return unauthorized('Missing authorization');
  const user = await getUserFromToken(token, fetchImpl);
  return user ? { kind: 'user', user, token } : unauthorized('Invalid or expired token');
}

/** Allow the service role or a signed-in platform super admin only. */
export async function requireAdminOrService(req: Request, fetchImpl: FetchLike = fetch): Promise<Caller | Response> {
  const caller = await requireUserOrService(req, fetchImpl);
  if (caller instanceof Response || caller.kind === 'service') return caller;
  return (await isSuperAdmin(caller.token, fetchImpl)) ? caller : forbidden('Admin only');
}

/**
 * For scheduled jobs: allow the service role, or an x-cron-secret header that
 * matches the CRON_SECRET secret. An unset CRON_SECRET never matches.
 */
export function requireCronOrService(req: Request): true | Response {
  if (isServiceRoleRequest(req)) return true;
  const expected = Deno.env.get('CRON_SECRET') ?? '';
  const provided = req.headers.get('x-cron-secret') ?? '';
  if (!expected) {
    return provided ? notConfigured('CRON_SECRET') : unauthorized('Missing credentials');
  }
  return provided && timingSafeEqual(provided, expected) ? true : unauthorized('Invalid cron secret');
}

/**
 * For inbound webhooks with a static shared secret (e.g. Airtable "Send
 * webhook" automations). The secret named by `secretEnv` must be configured;
 * the request must send it in one of `headerNames`.
 */
export function requireSharedSecret(req: Request, secretEnv: string, headerNames: string[]): true | Response {
  const expected = Deno.env.get(secretEnv) ?? '';
  if (!expected) return notConfigured(secretEnv);
  for (const name of headerNames) {
    const provided = req.headers.get(name);
    if (provided && timingSafeEqual(provided, expected)) return true;
  }
  return unauthorized('Invalid webhook token');
}

/** Headers Airtable automations may use to send a static webhook secret. */
export const WEBHOOK_SECRET_HEADERS = ['x-webhook-token', 'x-webhook-secret'];

/**
 * Parse a JSON webhook body and remove the `_secret` field (Airtable "Run a
 * script" automations send the shared secret there), so it is never logged or
 * stored. Returns null when the body is not a JSON object.
 */
export function parseWebhookBody(bodyText: string): { body: Record<string, unknown>; bodySecret: string | null } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const body = parsed as Record<string, unknown>;
  const raw = body._secret;
  delete body._secret;
  return { body, bodySecret: typeof raw === 'string' ? raw : null };
}

/**
 * Verify an inbound webhook's shared secret, sent either in a header
 * (x-webhook-token / x-webhook-secret, plus `extraHeaders`) or as `_secret` in
 * the JSON body. Fails closed when `secretEnv` is unset. On success returns
 * the parsed body with `_secret` removed.
 */
export function verifyWebhookSecret(
  req: Request,
  bodyText: string,
  secretEnv: string,
  extraHeaders: string[] = [],
): { ok: true; body: Record<string, unknown> } | { ok: false; response: Response; parsed: ReturnType<typeof parseWebhookBody> } {
  const parsed = parseWebhookBody(bodyText);
  const expected = Deno.env.get(secretEnv) ?? '';
  if (!expected) return { ok: false, response: notConfigured(secretEnv), parsed };
  const candidates = [...WEBHOOK_SECRET_HEADERS, ...extraHeaders].map((h) => req.headers.get(h));
  candidates.push(parsed?.bodySecret ?? null);
  const matched = candidates.some((c) => typeof c === 'string' && c !== '' && timingSafeEqual(c, expected));
  if (!matched) return { ok: false, response: unauthorized('Invalid webhook token'), parsed };
  if (!parsed) return { ok: false, response: jsonResponse({ error: 'Body must be a JSON object' }, 400), parsed };
  return { ok: true, body: parsed.body };
}

/** Hex HMAC-SHA256 of `body` with `secret`. */
export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
