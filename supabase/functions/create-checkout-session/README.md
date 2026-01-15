# Stripe Checkout Session Creator

Edge Function to create Stripe Checkout sessions for subscription upgrades.

## Setup

1. **Deploy the function:**
```bash
supabase functions deploy create-checkout-session
```

2. **Set environment variables:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

3. **Update price IDs:**
   - Create products in Stripe Dashboard
   - Get price IDs (e.g., `price_1ABC123...`)
   - Update `src/lib/stripe/config.ts` with actual price IDs

## Usage

Called from frontend when user clicks "Upgrade to Pro" button:

```typescript
const { data } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    priceId: STRIPE_PRODUCTS.pro.priceId,
    organizationId: currentOrg.id,
    returnUrl: `${window.location.origin}/data`,
  },
});

if (data?.checkoutUrl) {
  window.location.href = data.checkoutUrl;
}
```

## Request Body

```typescript
{
  priceId: string;        // Stripe price ID (e.g., "price_1ABC123...")
  organizationId: string;  // UUID of organization upgrading
  returnUrl: string;      // URL to redirect after payment (success or cancel)
}
```

## Response

```typescript
{
  checkoutUrl: string;    // Stripe Checkout URL to redirect user to
  sessionId: string;      // Stripe Checkout Session ID
}
```

## Security

- Requires valid JWT token in Authorization header
- Verifies user has access to organization
- Only owners and admins can upgrade
- Creates or retrieves Stripe customer for organization

## Testing

Test locally:
```bash
supabase functions serve create-checkout-session
```

Then call with:
```bash
curl -X POST http://localhost:54321/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_test_123",
    "organizationId": "org-uuid",
    "returnUrl": "http://localhost:5173/data"
  }'
```
