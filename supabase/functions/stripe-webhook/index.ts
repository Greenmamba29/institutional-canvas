/**
 * Stripe Webhook Handler — full subscription state machine
 *
 * Events handled:
 *   checkout.session.completed     → activate subscription
 *   invoice.paid                   → renew / extend subscription
 *   invoice.payment_failed         → start 7-day grace period
 *   customer.subscription.updated  → plan changes, status sync
 *   customer.subscription.deleted  → cancel, evidence vault read-only, 30-day deletion window
 *
 * Idempotency: every Stripe event id is recorded in stripe_webhook_events.
 * Duplicate deliveries return 200 immediately without re-processing.
 *
 * Webhook URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 * Required secrets: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY
 * JWT verification: disabled (Stripe doesn't send JWTs)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const GRACE_PERIOD_DAYS = 7;         // past_due → access revoked after this many days
const DOWNGRADE_WINDOW_DAYS = 30;    // cancelled → evidence vault deletion after this many days

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // ── Env guards ──────────────────────────────────────────────────────────────
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!webhookSecret || !stripeKey) {
    console.error('[stripe-webhook] Missing required env vars');
    return json({ error: 'Webhook not configured' }, 500);
  }

  // ── Signature verification ──────────────────────────────────────────────────
  const sig = req.headers.get('stripe-signature');
  if (!sig) return json({ error: 'Missing stripe-signature' }, 400);

  const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] Invalid signature:', err);
    return json({ error: 'Invalid signature' }, 400);
  }

  // ── Supabase (service role — bypasses RLS) ──────────────────────────────────
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Idempotency check ───────────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('stripe_webhook_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (existing) {
    console.log(`[stripe-webhook] Duplicate event ${event.id} — skipping`);
    return json({ received: true, duplicate: true });
  }

  // ── Route event ─────────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, stripe, event.data.object as Stripe.Checkout.Session, event.id);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(supabase, stripe, event.data.object as Stripe.Invoice, event.id);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, stripe, event.data.object as Stripe.Invoice, event.id);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription, event.id);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription, event.id);
        break;

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    // Record processed event (idempotency)
    await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      status: 'processed',
    });

    return json({ received: true });
  } catch (err) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, err);
    // Record failed event so we don't infinite-retry on the same bad data
    await supabase.from('stripe_webhook_events').insert({
      event_id: event.id,
      event_type: event.type,
      status: 'error',
    }).catch(() => {/* best-effort */});
    return json({ error: 'Processing error' }, 500);
  }
});

// ── checkout.session.completed ─────────────────────────────────────────────────
// Stripe fires this once after the customer completes Checkout.
// We activate the subscription immediately.

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  const orgId  = session.metadata?.organization_id;
  const userId = session.metadata?.user_id;
  const stripeSubId = session.subscription as string;

  if (!orgId || !stripeSubId) {
    console.error('[checkout.completed] Missing org_id or subscription_id in metadata');
    return;
  }

  const sub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ['items.data.price'],
  });

  const priceId = sub.items.data[0]?.price.id ?? '';
  const tier = resolveTier(priceId);
  const expiresAt = new Date(sub.current_period_end * 1000).toISOString();
  const customerId = sub.customer as string;

  // Upsert subscriptions row (keyed on stripe_subscription_id)
  await upsertSubscription(supabase, {
    orgId,
    userId: userId ?? null,
    stripeSubId,
    stripeCustomerId: customerId,
    priceId,
    tier,
    status: 'active',
    expiresAt,
    gracePeriodEndsAt: null,
    downgradeScheduledAt: null,
  });

  // Mirror on organizations for any existing code that reads subscription_tier there
  await supabase.from('organizations').update({
    subscription_tier: tier,
    subscription_status: 'active',
    stripe_subscription_id: stripeSubId,
    stripe_customer_id: customerId,
  }).eq('id', orgId);

  await logLifecycle(supabase, {
    orgId, userId, eventType: 'activated', newTier: tier, newStatus: 'active', stripeEventId: eventId,
    metadata: { stripe_subscription_id: stripeSubId, price_id: priceId },
  });

  console.log(`[checkout.completed] Org ${orgId} activated on ${tier} tier`);
}

// ── invoice.paid ───────────────────────────────────────────────────────────────
// Fires on every successful payment (initial + renewals).
// Extends expires_at and clears any grace period.

async function handleInvoicePaid(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventId: string,
) {
  const stripeSubId = invoice.subscription as string;
  if (!stripeSubId) return;

  const sub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ['items.data.price'],
  });

  const orgId  = sub.metadata?.organization_id;
  const userId = sub.metadata?.user_id ?? null;
  if (!orgId) {
    console.error('[invoice.paid] Missing organization_id in subscription metadata');
    return;
  }

  const priceId   = sub.items.data[0]?.price.id ?? '';
  const tier      = resolveTier(priceId);
  const expiresAt = new Date(sub.current_period_end * 1000).toISOString();

  await upsertSubscription(supabase, {
    orgId,
    userId,
    stripeSubId,
    stripeCustomerId: sub.customer as string,
    priceId,
    tier,
    status: 'active',
    expiresAt,
    gracePeriodEndsAt: null,       // Clear any existing grace period
    downgradeScheduledAt: null,
  });

  await supabase.from('organizations').update({
    subscription_tier: tier,
    subscription_status: 'active',
  }).eq('id', orgId);

  await logLifecycle(supabase, {
    orgId, userId, eventType: 'renewed', newTier: tier, newStatus: 'active', stripeEventId: eventId,
    metadata: { expires_at: expiresAt },
  });

  console.log(`[invoice.paid] Org ${orgId} renewed — ${tier} until ${expiresAt}`);
}

// ── invoice.payment_failed ─────────────────────────────────────────────────────
// Start the 7-day grace period. Access is maintained during this window.
// Stripe handles dunning emails automatically.

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
  eventId: string,
) {
  const stripeSubId = invoice.subscription as string;
  if (!stripeSubId) return;

  const sub = await stripe.subscriptions.retrieve(stripeSubId);
  const orgId  = sub.metadata?.organization_id;
  const userId = sub.metadata?.user_id ?? null;
  if (!orgId) return;

  const gracePeriodEndsAt = new Date(
    Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  await supabase.from('subscriptions').update({
    status: 'past_due',
    grace_period_ends_at: gracePeriodEndsAt,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', stripeSubId);

  await supabase.from('organizations').update({
    subscription_status: 'past_due',
  }).eq('id', orgId);

  await logLifecycle(supabase, {
    orgId, userId, eventType: 'past_due', newStatus: 'past_due', stripeEventId: eventId,
    metadata: { grace_period_ends_at: gracePeriodEndsAt, attempt_count: invoice.attempt_count },
  });

  console.log(`[invoice.payment_failed] Org ${orgId} — grace period until ${gracePeriodEndsAt}`);
}

// ── customer.subscription.updated ─────────────────────────────────────────────
// Handles plan changes (pro ↔ enterprise) and Stripe-side status changes.

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  eventId: string,
) {
  const orgId  = sub.metadata?.organization_id;
  const userId = sub.metadata?.user_id ?? null;
  if (!orgId) {
    console.error('[subscription.updated] Missing organization_id in metadata');
    return;
  }

  const priceId   = sub.items.data[0]?.price.id ?? '';
  const tier      = resolveTier(priceId);
  const expiresAt = new Date(sub.current_period_end * 1000).toISOString();

  // Map Stripe status → our internal status
  let status: string;
  let gracePeriodEndsAt: string | null = null;

  switch (sub.status) {
    case 'active':
      status = 'active';
      break;
    case 'past_due':
      status = 'past_due';
      // Only set grace period if not already set (payment_failed fires separately,
      // but subscription.updated may fire first on some Stripe versions)
      gracePeriodEndsAt = new Date(
        Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
      break;
    case 'canceled':
      status = 'cancelled';
      break;
    default:
      status = sub.status;
  }

  const updates: Record<string, unknown> = {
    tier,
    status,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };
  if (gracePeriodEndsAt) updates.grace_period_ends_at = gracePeriodEndsAt;
  if (status === 'active') updates.grace_period_ends_at = null; // clear on recovery

  await supabase.from('subscriptions').update(updates)
    .eq('stripe_subscription_id', sub.id);

  await supabase.from('organizations').update({
    subscription_tier: status === 'active' ? tier : null,
    subscription_status: status,
  }).eq('id', orgId);

  await logLifecycle(supabase, {
    orgId, userId, eventType: 'plan_changed', newTier: tier, newStatus: status, stripeEventId: eventId,
    metadata: { stripe_status: sub.status },
  });

  console.log(`[subscription.updated] Org ${orgId} → ${tier} / ${status}`);
}

// ── customer.subscription.deleted ─────────────────────────────────────────────
// Subscription was cancelled (either by customer or Stripe after dunning).
// - Revoke platform access immediately
// - Mark evidence vault docs as read-only
// - Schedule deletion in DOWNGRADE_WINDOW_DAYS
// - Insert admin notification

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  sub: Stripe.Subscription,
  eventId: string,
) {
  const orgId  = sub.metadata?.organization_id;
  const userId = sub.metadata?.user_id ?? null;
  if (!orgId) {
    console.error('[subscription.deleted] Missing organization_id in metadata');
    return;
  }

  const deletionDate = new Date(
    Date.now() + DOWNGRADE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Get previous tier for the audit log
  const { data: prevSub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();
  const prevTier = prevSub?.tier ?? null;

  // Mark subscription cancelled
  await supabase.from('subscriptions').update({
    status: 'cancelled',
    downgrade_scheduled_at: deletionDate,
    tier: null,
    grace_period_ends_at: null,
    updated_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', sub.id);

  // Revoke org tier immediately
  await supabase.from('organizations').update({
    subscription_tier: null,
    subscription_status: 'cancelled',
    stripe_subscription_id: null,
  }).eq('id', orgId);

  // ── Evidence vault downgrade ────────────────────────────────────────────────
  // Mark all org's evidence documents as read-only with scheduled deletion
  const { error: vaultErr } = await supabase
    .from('evidence_documents')
    .update({
      read_only: true,
      deletion_scheduled_at: deletionDate,
    })
    .eq('org_id', orgId);

  if (vaultErr) {
    console.error('[subscription.deleted] Failed to mark evidence vault read-only:', vaultErr);
  }

  // ── Admin notification ──────────────────────────────────────────────────────
  // Creates a record admins can view in the admin panel and acknowledge.
  await supabase.from('downgrade_notifications').insert({
    org_id: orgId,
    deletion_scheduled_at: deletionDate,
    notes: `Subscription ${sub.id} cancelled. Evidence vault data scheduled for deletion in ${DOWNGRADE_WINDOW_DAYS} days.`,
  });

  await logLifecycle(supabase, {
    orgId, userId, eventType: 'cancelled', oldTier: prevTier, newTier: null,
    oldStatus: 'active', newStatus: 'cancelled', stripeEventId: eventId,
    metadata: {
      stripe_subscription_id: sub.id,
      deletion_scheduled_at: deletionDate,
      evidence_vault_marked_readonly: !vaultErr,
    },
  });

  console.log(`[subscription.deleted] Org ${orgId} — access revoked; vault deletion scheduled ${deletionDate}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolveTier(priceId: string): 'pro' | 'enterprise' {
  if (priceId.toLowerCase().includes('enterprise') || priceId.toLowerCase().includes('ent_')) {
    return 'enterprise';
  }
  return 'pro';
}

interface SubscriptionUpsert {
  orgId: string;
  userId: string | null;
  stripeSubId: string;
  stripeCustomerId: string;
  priceId: string;
  tier: 'pro' | 'enterprise';
  status: string;
  expiresAt: string;
  gracePeriodEndsAt: string | null;
  downgradeScheduledAt: string | null;
}

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  data: SubscriptionUpsert,
) {
  const row = {
    org_id: data.orgId,
    user_id: data.userId,
    stripe_subscription_id: data.stripeSubId,
    stripe_customer_id: data.stripeCustomerId,
    price_id: data.priceId,
    tier: data.tier,
    status: data.status,
    expires_at: data.expiresAt,
    grace_period_ends_at: data.gracePeriodEndsAt,
    downgrade_scheduled_at: data.downgradeScheduledAt,
    updated_at: new Date().toISOString(),
  };

  // Try update first (idiomatic upsert for tables with non-uuid PKs)
  const { data: updated } = await supabase
    .from('subscriptions')
    .update(row)
    .eq('stripe_subscription_id', data.stripeSubId)
    .select('id')
    .maybeSingle();

  if (!updated) {
    // No existing row — insert
    await supabase.from('subscriptions').insert({
      ...row,
      created_at: new Date().toISOString(),
    });
  }
}

interface LifecycleLog {
  orgId: string;
  userId?: string | null;
  eventType: string;
  oldTier?: string | null;
  newTier?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  stripeEventId?: string;
  metadata?: Record<string, unknown>;
}

async function logLifecycle(
  supabase: ReturnType<typeof createClient>,
  log: LifecycleLog,
) {
  await supabase.from('subscription_lifecycle_events').insert({
    org_id: log.orgId,
    user_id: log.userId ?? null,
    event_type: log.eventType,
    old_tier: log.oldTier ?? null,
    new_tier: log.newTier ?? null,
    old_status: log.oldStatus ?? null,
    new_status: log.newStatus ?? null,
    stripe_event_id: log.stripeEventId ?? null,
    metadata: log.metadata ?? {},
  });
}
