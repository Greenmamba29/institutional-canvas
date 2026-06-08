/**
 * Subscription Hook — real database integration with self-serve free trial.
 *
 * Access model:
 *   - Admin org type           → enterprise-level access (bypass)
 *   - Active paid subscription → resolved tier (pro / enterprise)
 *   - Active free trial        → full (pro-equivalent) access, tier === 'trial'
 *   - Otherwise                → no access (paywall / upgrade)
 *
 * An active trial is one where now() < organizations.trial_ends_at. The trial
 * is a launch concession to kill the "paywall on everything" flow: new orgs get
 * 3 days of full access (no card), then must pick a paid plan.
 */

import { useOrganization } from '@/context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type SubscriptionTier = 'trial' | 'pro' | 'enterprise';

export interface Subscription {
  tier: SubscriptionTier;
  features: string[];
  expires_at: string | null;
  status: string;
  /** True while the org is inside its free-trial window. */
  isTrialActive: boolean;
  /** Whole days remaining in the trial (0 when not on a trial). */
  trialDaysLeft: number;
  /** ISO timestamp the trial expires, when on a trial. */
  trialEndsAt: string | null;
}

/**
 * Feature keys by tier.
 *
 * Trial:      pro-equivalent access (full procurement + grant intelligence)
 * Pro:        core procurement + grant intelligence (readiness, eligibility, evidence vault)
 * Enterprise: all Pro features + partner matching, funding pipeline, TeleBuy, auctions,
 *             API access, SSO, white-label, dedicated support
 */
const PRO_FEATURES: string[] = [
  // Procurement core
  'unlimited_rfqs',
  'purchase_orders',
  'supplier_verification',
  'market_intelligence',
  'analytics',
  // Grant intelligence — Pro tier
  'grant_tracker',
  'eligibility_engine',
  'readiness_dashboard',
  'evidence_vault',
  // Data
  'data_hub',
  'priority_support',
  // Phase 2 — Recycling & Compliance (Pro)
  'compliance_audit',
  'recycling_registry',
];

const ENTERPRISE_FEATURES: string[] = [
  ...PRO_FEATURES,
  // Enterprise-only
  'partner_matching',
  'funding_pipeline',
  'telebuy',
  'auctions',
  'ai_studio',
  'api_access',
  'white_label',
  'sso',
  'daily_co_premium',
  'dedicated_account_manager',
  // Phase 2 — Recycling & Compliance (Enterprise)
  'battery_collection',
  'chain_of_custody',
];

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  // A trial grants the full Pro feature set.
  trial: PRO_FEATURES,
  pro: PRO_FEATURES,
  enterprise: ENTERPRISE_FEATURES,
};

interface TrialStatus {
  is_trial_active: boolean;
  trial_ends_at: string | null;
  trial_days_left: number;
}

export function useSubscription() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();

  return useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id, currentOrg?.id],
    queryFn: async () => {
      if (!user) return null;

      // Admin org type gets enterprise-level access without a Stripe subscription
      if (currentOrg?.org_type === 'admin') {
        return {
          tier: 'enterprise',
          features: TIER_FEATURES.enterprise,
          expires_at: null,
          status: 'active',
          isTrialActive: false,
          trialDaysLeft: 0,
          trialEndsAt: null,
        };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
      }

      const isExpired = data?.expires_at && new Date(data.expires_at) < new Date();

      // Active paid subscription wins over any trial.
      if (data && !isExpired) {
        // Resolve tier from the price_id stored on the subscription row
        const priceId = data.price_id || '';
        let tier: SubscriptionTier = 'pro';
        if (priceId.includes('enterprise') || priceId.includes('ent_')) {
          tier = 'enterprise';
        }

        return {
          tier,
          features: TIER_FEATURES[tier],
          expires_at: data.expires_at ?? null,
          status: data.status,
          isTrialActive: false,
          trialDaysLeft: 0,
          trialEndsAt: null,
        };
      }

      // No active paid subscription — fall back to the org's free-trial window.
      const { data: trialRows, error: trialError } = await supabase.rpc('org_trial_status');
      if (trialError) {
        console.error('Error fetching trial status:', trialError);
        return null;
      }

      const trial = (Array.isArray(trialRows) ? trialRows[0] : trialRows) as
        | TrialStatus
        | undefined;

      if (trial?.is_trial_active) {
        return {
          tier: 'trial',
          features: TIER_FEATURES.trial,
          expires_at: trial.trial_ends_at,
          status: 'trialing',
          isTrialActive: true,
          trialDaysLeft: trial.trial_days_left ?? 0,
          trialEndsAt: trial.trial_ends_at,
        };
      }

      return null;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useHasFeature(featureKey: string): boolean {
  const { data: subscription } = useSubscription();
  if (!subscription) return false;
  if (subscription.tier === 'enterprise') return true;
  return subscription.features.includes(featureKey);
}

export function useSubscriptionTier(): SubscriptionTier | null {
  const { data: subscription } = useSubscription();
  return subscription?.tier ?? null;
}

/**
 * True when the user currently meets the required tier. A free trial satisfies
 * the 'pro' bar (full procurement + grant intelligence) but not 'enterprise'.
 */
export function useRequiresTier(requiredTier: SubscriptionTier): boolean {
  const tier = useSubscriptionTier();
  if (!tier) return false;
  if (requiredTier === 'pro') return tier === 'trial' || tier === 'pro' || tier === 'enterprise';
  return tier === 'enterprise';
}

/** Whether the current org is inside an active free-trial window. */
export function useIsTrialActive(): boolean {
  const { data: subscription } = useSubscription();
  return subscription?.isTrialActive ?? false;
}

/** Whole days left in the active trial (0 when not on a trial). */
export function useTrialDaysLeft(): number {
  const { data: subscription } = useSubscription();
  return subscription?.trialDaysLeft ?? 0;
}
