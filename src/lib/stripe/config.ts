/**
 * Stripe Configuration
 * 
 * Product and pricing configuration for LithiumBuy subscriptions.
 * Update price IDs after creating products in Stripe Dashboard.
 */

export const STRIPE_PRODUCTS = {
  pro: {
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_xxx', // Replace with actual price ID from Stripe Dashboard
    name: 'Pro',
    price: 199,
    features: [
      'AI Studio (SPOT.ai Market Intelligence)',
      'Data Hub (Market data & analytics)',
      'Priority Support',
      'Advanced Analytics',
    ],
  },
  enterprise: {
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || 'price_yyy', // Replace with actual price ID
    name: 'Enterprise',
    price: 1999,
    features: [
      'All Pro features',
      'API Access',
      'SSO Integration',
      'White-label Options',
      'Dedicated Account Manager',
      'Custom Integrations',
    ],
  },
};

/**
 * Get Stripe publishable key from environment
 */
export function getStripePublishableKey(): string {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.warn('VITE_STRIPE_PUBLISHABLE_KEY not set. Stripe integration will not work.');
  }
  return key || '';
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
}
