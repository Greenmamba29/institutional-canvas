# Stripe Webhook Handler

Edge Function to handle Stripe webhook events for subscription lifecycle management.

## Setup

1. **Deploy the function:**
```bash
supabase functions deploy stripe-webhook
```

2. **Set environment variables:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Configure webhook in Stripe Dashboard:**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   - Select events to listen:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Event Handlers

### checkout.session.completed
- Triggered when user completes payment
- Updates organization `subscription_tier` to 'pro' or 'enterprise'
- Sets `subscription_status` to 'active'
- Saves `stripe_subscription_id`

### customer.subscription.updated
- Triggered when subscription status changes
- Updates `subscription_status` (active, past_due, cancelled, etc.)
- Updates `subscription_tier` if price changed

### customer.subscription.deleted
- Triggered when subscription is cancelled
- Downgrades organization to 'free' tier
- Sets `subscription_status` to 'cancelled'
- Clears `stripe_subscription_id`

## Security

- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Rejects requests with invalid signatures
- Uses Supabase service role key for database updates

## Testing

Test locally with Stripe CLI:
```bash
# Install Stripe CLI
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

## Database Updates

The webhook updates the `organizations` table:
- `subscription_tier`: 'free' | 'pro' | 'enterprise'
- `subscription_status`: 'active' | 'past_due' | 'cancelled' | 'inactive'
- `stripe_customer_id`: Stripe customer ID (set during checkout)
- `stripe_subscription_id`: Stripe subscription ID (set after payment)
