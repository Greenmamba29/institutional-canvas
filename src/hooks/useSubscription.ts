/**
 * Subscription Hooks
 * 
 * React Query hooks for subscription management.
 * Admin role bypasses all paywall checks (unlimited access).
 */

import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client';
import { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface SubscriptionData {
  subscription_tier: 'free' | 'pro' | 'enterprise' | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
}

/**
 * Fetch subscription data for the current organization
 */
async function getOrgSubscription(
  orgId: string | null,
  accessToken: string
): Promise<SubscriptionData | null> {
  if (!orgId) return null;

  // TODO: Update when database migration adds subscription columns
  // For now, return default free tier since subscription columns don't exist yet
  // The columns subscription_tier, subscription_status, stripe_customer_id, 
  // stripe_subscription_id need to be added to the organizations table
  return {
    subscription_tier: 'free',
    subscription_status: 'active',
    stripe_customer_id: null,
    stripe_subscription_id: null,
  };
}

/**
 * Hook to fetch current organization's subscription
 */
export function useSubscription() {
  const { currentOrgId } = useOrganization();
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['subscription', currentOrgId],
    queryFn: async () => {
      const token = await getAccessToken();
      return getOrgSubscription(currentOrgId, token);
    },
    enabled: isAuthenticated && !!currentOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if user can access a feature
 * Admin role bypasses all checks (unlimited access)
 */
export function useCanAccessFeature(feature: 'ai_studio' | 'data_hub'): boolean {
  const { viewMode } = useOrganization();
  const { data: subscription } = useSubscription();

  // Admin has unlimited access - NO locks
  if (viewMode === 'admin') {
    return true;
  }

  // Check subscription tier (once database migration is applied)
  const tier = subscription?.subscription_tier;
  return tier === 'pro' || tier === 'enterprise';
}
