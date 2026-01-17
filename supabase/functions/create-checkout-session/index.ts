/**
 * Stripe Checkout Session Creator
 * 
 * Creates a Stripe Checkout session for subscription upgrades.
 * Called from frontend when user clicks "Upgrade to Pro" button.
 * 
 * Endpoint: POST /functions/v1/create-checkout-session
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  priceId: string;
  organizationId: string;
  returnUrl: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { priceId, organizationId, returnUrl }: CheckoutRequest = await req.json();

    if (!priceId || !organizationId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, organizationId, returnUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (orgError || !orgMember) {
      return new Response(
        JSON.stringify({ error: 'User does not have access to this organization' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (orgMember.role !== 'owner' && orgMember.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only organization owners and admins can upgrade subscriptions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name')
      .eq('id', organizationId)
      .single();

    let customerId = organization?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: organization?.name || 'LithiumBuy Organization',
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
        },
      },
    });

    return new Response(
      JSON.stringify({ 
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Checkout session creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
