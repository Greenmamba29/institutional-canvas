/**
 * Stripe Webhook Handler
 * 
 * Handles Stripe webhook events for subscription lifecycle management.
 * Updates organization subscription_tier when payment succeeds.
 * 
 * Webhook URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 * 
 * Configure in Stripe Dashboard:
 * - Webhook URL: https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 * - Events to listen: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Stripe signature from header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe-signature header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook secret
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Get request body
    const body = await req.text();

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Handle checkout.session.completed event
 * Updates organization subscription_tier to 'pro' or 'enterprise'
 */
async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const organizationId = session.metadata?.organization_id;
  const subscriptionId = session.subscription as string;

  if (!organizationId || !subscriptionId) {
    console.error('Missing organization_id or subscription_id in session metadata');
    return;
  }

  // Get subscription details to determine tier
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId?.includes('pro') ? 'pro' : 
               priceId?.includes('enterprise') ? 'enterprise' : 
               'pro'; // Default to pro

  // Update organization
  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error updating organization subscription:', error);
    throw error;
  }

  console.log(`Updated organization ${organizationId} to ${tier} tier`);
}

/**
 * Handle customer.subscription.updated event
 * Updates subscription status if changed
 */
async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata?.organization_id;
  
  if (!organizationId) {
    console.error('Missing organization_id in subscription metadata');
    return;
  }

  const status = subscription.status === 'active' ? 'active' : 
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'cancelled' : 'inactive';

  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price.id;
  const tier = priceId?.includes('pro') ? 'pro' : 
               priceId?.includes('enterprise') ? 'enterprise' : 
               'pro';

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }

  console.log(`Updated organization ${organizationId} subscription status to ${status}`);
}

/**
 * Handle customer.subscription.deleted event
 * Downgrades organization to 'free' tier
 */
async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata?.organization_id;
  
  if (!organizationId) {
    console.error('Missing organization_id in subscription metadata');
    return;
  }

  const { error } = await supabase
    .from('organizations')
    .update({
      subscription_tier: 'free',
      subscription_status: 'cancelled',
      stripe_subscription_id: null,
    })
    .eq('id', organizationId);

  if (error) {
    console.error('Error downgrading organization:', error);
    throw error;
  }

  console.log(`Downgraded organization ${organizationId} to free tier`);
}
