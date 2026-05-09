/**
 * Make.com Webhook Handler for Market Intelligence
 * Receives webhooks from Make.com scenarios and writes to market tables
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MAKE_WEBHOOK_SECRET = Deno.env.get('MAKE_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Timing-safe string comparison to prevent secret oracle attacks.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.generateKey(
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const viewA = new Uint8Array(sigA);
  const viewB = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < viewA.length; i++) {
    diff |= viewA[i] ^ viewB[i];
  }
  return diff === 0;
}

/**
 * Authenticate the request using the x-make-secret header.
 *
 * Make.com scenarios can send a custom HTTP header with every webhook request.
 * Configure the header name as "x-make-secret" and the value as the shared
 * secret stored in MAKE_WEBHOOK_SECRET.
 *
 * When MAKE_WEBHOOK_SECRET is not set (local dev), the check is skipped with a
 * warning. In production the secret must be set or all requests will be rejected.
 */
async function verifyMakeSecret(req: Request): Promise<boolean> {
  if (!MAKE_WEBHOOK_SECRET) {
    console.warn('[make-webhook] MAKE_WEBHOOK_SECRET is not set; skipping auth (dev mode)');
    return true;
  }

  const provided = req.headers.get('x-make-secret');
  if (!provided) {
    console.error('[make-webhook] Request rejected: x-make-secret header missing');
    return false;
  }

  const match = await timingSafeEqual(provided, MAKE_WEBHOOK_SECRET);
  if (!match) {
    console.error('[make-webhook] Request rejected: x-make-secret header does not match MAKE_WEBHOOK_SECRET');
  }
  return match;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Authenticate before reading the body to avoid unnecessary processing.
  const isAuthorized = await verifyMakeSecret(req);
  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const payload = await req.json()
    console.log('[Make Webhook] Received:', JSON.stringify(payload))

    if (!payload.event) {
      return new Response(
        JSON.stringify({ error: 'Missing event type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call the RPC function to handle the webhook
    const { data, error } = await supabase.rpc('handle_make_webhook', { payload })

    if (error) {
      console.error('[Make Webhook] DB error:', error)
      throw error
    }

    console.log('[Make Webhook] Success:', data)

    return new Response(
      JSON.stringify({ success: true, event: payload.event, result: data, timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Make Webhook] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, timestamp: new Date().toISOString() }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
