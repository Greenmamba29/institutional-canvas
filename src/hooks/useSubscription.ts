/**
 * Subscription Hook — real database integration, no free tier.
 *
 * All users must have an active paid subscription (pro or enterprise).
 * Admin org type receives enterprise-level access by bypass.
 */

import { useOrganization } from '@/context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type SubscriptionTier = 'pro' | 'enterprise';

export interface Subscription {
  tier: SubscriptionTier;
  features: string[];
  expires_at: string | null;
  status: string;
}

/**
 * Feature keys by tier.
 *
 * Pro:        core procurement + grant intelligence (readiness, eligibility, evidence vault)
 * Enterprise: all Pro features + partner matching, funding pipeline, TeleBuy, auctions,
 *             API access, SSO, white-label, dedicated support
 */
const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  pro: [
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
  ],
  enterprise: [
    // All Pro features
    'unlimited_rfqs',
    'purchase_orders',
    'supplier_verification',
    'market_intelligence',
    'analytics',
    'grant_tracker',
    'eligibility_engine',
    'readiness_dashboard',
    'evidence_vault',
    'data_hub',
    'priority_support',
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
  ],
};

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
        return null;
      }

      if (!data) return null;

      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
      if (isExpired) return null;

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
      };
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

export function useRequiresTier(requiredTier: SubscriptionTier): boolean {
  const tier = useSubscriptionTier();
  if (!tier) return false;
  if (requiredTier === 'pro') return tier === 'pro' || tier === 'enterprise';
  return tier === 'enterprise';
}
