/**
 * Stripe Checkout Session Creator
 *
 * Creates a Stripe Checkout session for new subscriptions or plan upgrades.
 * Supports monthly and annual billing. Enables tax collection and promotion codes.
 *
 * POST /functions/v1/create-checkout-session
 * Authorization: Bearer <supabase-jwt>
 *
 * Body:
 *   priceId        string   — Stripe price ID (monthly or annual)
 *   organizationId string   — Supabase org UUID
 *   returnUrl      string   — Base URL for success/cancel redirects
 *   billing?       'monthly' | 'annual'  — used only for display; priceId drives actual billing
 *
 * Returns:
 *   { checkoutUrl: string, sessionId: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface CheckoutRequest {
  priceId: string;
  organizationId: string;
  returnUrl: string;
  billing?: 'monthly' | 'annual';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Invalid token' }, 401);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body: CheckoutRequest = await req.json();
    const { priceId, organizationId, returnUrl, billing = 'monthly' } = body;

    if (!priceId || !organizationId || !returnUrl) {
      return json({ error: 'Missing required fields: priceId, organizationId, returnUrl' }, 400);
    }

    // ── Verify org membership (owner or admin only can purchase) ──────────────
    // Check both org_members (legacy) and organization_members tables
    const [{ data: orgMember }, { data: orgMemberNew }] = await Promise.all([
      supabase
        .from('org_members')
        .select('role')
        .eq('org_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const member = orgMember ?? orgMemberNew;
    if (!member) {
      return json({ error: 'User is not a member of this organization' }, 403);
    }
    if (!['owner', 'admin'].includes(member.role)) {
      return json({ error: 'Only organization owners and admins can purchase subscriptions' }, 403);
    }

    // ── Stripe init ───────────────────────────────────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return json({ error: 'Stripe not configured' }, 500);

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // ── Get or create Stripe customer (idempotent) ────────────────────────────
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name, email')
      .eq('id', organizationId)
      .single();

    let customerId = org?.stripe_customer_id;

    if (!customerId) {
      // Check if a Stripe customer already exists for this email to avoid duplicates
      if (user.email) {
        const existing = await stripe.customers.list({ email: user.email, limit: 1 });
        if (existing.data.length > 0) {
          customerId = existing.data[0].id;
        }
      }

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: org?.name ?? 'LithiumBuy Customer',
          metadata: {
            organization_id: organizationId,
            user_id: user.id,
            supabase_org_name: org?.name ?? '',
          },
        });
        customerId = customer.id;
      }

      // Store customer id on organization (best-effort — don't fail checkout if this errors)
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
        .then(({ error }) => {
          if (error) console.warn('[create-checkout] Failed to store stripe_customer_id:', error);
        });
    }

    // ── Check for existing active subscription (upgrade flow) ─────────────────
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, tier, status')
      .eq('org_id', organizationId)
      .eq('status', 'active')
      .maybeSingle();

    // If upgrading an existing subscription, use the billing portal instead of Checkout
    if (currentSub?.stripe_subscription_id) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      return json({ checkoutUrl: portalSession.url, sessionId: null, mode: 'portal' });
    }

    // ── Create Checkout session ───────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',

      // Success: include session ID so frontend can show confirmation
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&billing=${billing}`,
      cancel_url: `${returnUrl}?cancelled=1`,

      // Metadata passed through to subscription and all subsequent invoices
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      },

      // Tax collection (Stripe Tax must be configured in dashboard)
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },

      // Let customers use promotion codes
      allow_promotion_codes: true,

      // Collect billing address for tax purposes
      billing_address_collection: 'auto',

      // Show the plan name in Checkout
      custom_text: {
        submit: {
          message: `You're subscribing to LithiumBuy ${billing === 'annual' ? 'annual' : 'monthly'} — billed immediately.`,
        },
      },
    });

    return json({ checkoutUrl: session.url, sessionId: session.id, mode: 'checkout' });

  } catch (err: unknown) {
    console.error('[create-checkout-session] Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to create checkout session';
    return json({ error: msg }, 500);
  }
});
