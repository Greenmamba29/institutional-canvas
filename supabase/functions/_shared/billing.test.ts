// Run: deno test --allow-env supabase/functions/_shared/
import { resolveTierFromConfig, trialDays } from './billing.ts';

function eq(a: unknown, b: unknown) {
  if (a !== b) throw new Error(`expected ${String(b)}, got ${String(a)}`);
}
const cfg = { enterprise: ['price_1EntM', 'price_1EntY'], pro: ['price_1ProM', undefined] };

Deno.test('real Stripe price ids resolve by configuration, not by name', () => {
  eq(resolveTierFromConfig('price_1EntM', cfg), 'enterprise');
  eq(resolveTierFromConfig('price_1EntY', cfg), 'enterprise');
  eq(resolveTierFromConfig('price_1ProM', cfg), 'pro');
});

Deno.test('unknown ids: legacy name heuristic, then pro', () => {
  eq(resolveTierFromConfig('price_enterprise_monthly', cfg), 'enterprise');
  eq(resolveTierFromConfig('price_1Unknown', cfg), 'pro');
  eq(resolveTierFromConfig('', { enterprise: [undefined, ''], pro: [] }), 'pro');
});

Deno.test('trialDays: default 3, 0 disables, capped, junk disables', () => {
  Deno.env.delete('STRIPE_TRIAL_DAYS'); eq(trialDays(), 3);
  Deno.env.set('STRIPE_TRIAL_DAYS', '0'); eq(trialDays(), 0);
  Deno.env.set('STRIPE_TRIAL_DAYS', '7'); eq(trialDays(), 7);
  Deno.env.set('STRIPE_TRIAL_DAYS', '90'); eq(trialDays(), 30);
  Deno.env.set('STRIPE_TRIAL_DAYS', 'abc'); eq(trialDays(), 0);
  Deno.env.delete('STRIPE_TRIAL_DAYS');
});
