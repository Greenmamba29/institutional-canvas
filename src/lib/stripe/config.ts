/**
 * Stripe Configuration — LithiumBuy Procurement & Grant Intelligence
 *
 * Pro  $599/month  — Core procurement + grant intelligence (RFQs, readiness, evidence vault)
 * Enterprise $4,999/month — Full suite including partner matching, funding pipeline, TeleBuy
 *
 * After creating products in Stripe Dashboard, set the environment variables below.
 * Annual price IDs should be separate Stripe prices at 20% discount.
 */

export const STRIPE_PRODUCTS = {
  pro: {
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    annualPriceId: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID || 'price_pro_annual',
    name: 'Pro',
    price: 599,
    annualPrice: 479,       // ~20% off — billed as $5,748/year
    currency: 'usd',
    features: [
      'Unlimited RFQs & purchase orders',
      'Grant tracker — DOE, DOD, ARPA-E & state programs',
      'Eligibility scoring engine',
      'Grant readiness dashboard',
      'Evidence vault (document management)',
      'Supplier verification & risk scores',
      'Market & grant intelligence hub',
      'Priority support',
    ],
  },
  enterprise: {
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    annualPriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_ANNUAL_PRICE_ID || 'price_enterprise_annual',
    name: 'Enterprise',
    price: 4999,
    annualPrice: 3999,      // ~20% off — billed as $47,988/year
    currency: 'usd',
    features: [
      'Everything in Pro',
      'Partner matching & consortium builder',
      'Funding pipeline — auto RFQ/PO on grant award',
      'TeleBuy video negotiations',
      'Auction system access',
      'API access & webhooks',
      'SSO & white-label options',
      'Dedicated account manager',
      'Custom integrations',
      'Success-fee grant advisory',
    ],
  },
} as const;

export type StripePlan = keyof typeof STRIPE_PRODUCTS;

export function getStripePublishableKey(): string {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('[Stripe] VITE_STRIPE_PUBLISHABLE_KEY not set.');
  }
  return key || '';
}

export function isStripeConfigured(): boolean {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
}
