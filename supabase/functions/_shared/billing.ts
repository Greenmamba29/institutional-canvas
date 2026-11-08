/**
 * Billing helpers shared by create-checkout-session and stripe-webhook.
 * No remote imports, so this module is unit-testable offline.
 */

export type PaidTier = 'pro' | 'enterprise';

/**
 * Map a Stripe price ID to a plan using the configured price IDs.
 * Unknown IDs fall back to the legacy name heuristic (test-mode IDs such as
 * "price_enterprise_monthly"), then to 'pro', and are logged so a missing
 * STRIPE_*_PRICE_ID secret shows up in the function logs.
 */
export function resolveTierFromConfig(
  priceId: string,
  config: { enterprise: (string | undefined)[]; pro: (string | undefined)[] },
): PaidTier {
  const has = (ids: (string | undefined)[]) => ids.some((id) => !!id && id === priceId);
  if (has(config.enterprise)) return 'enterprise';
  if (has(config.pro)) return 'pro';
  const lower = priceId.toLowerCase();
  if (lower.includes('enterprise') || lower.includes('ent_')) return 'enterprise';
  console.warn(`[billing] Price ${priceId} matches no configured STRIPE_*_PRICE_ID; recording as 'pro'`);
  return 'pro';
}

/** Trial length for new subscriptions, from STRIPE_TRIAL_DAYS (default 3, 0 disables). */
export function trialDays(): number {
  const raw = Deno.env.get('STRIPE_TRIAL_DAYS');
  const n = raw === undefined || raw === '' ? 3 : Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 30) : 0;
}
