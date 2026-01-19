/**
 * Subscription Hook - Real database integration
 * 
 * Queries the subscriptions table for actual subscription status.
 * Falls back to org type check for admin bypass.
 */

import { useOrganization } from '@/context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  features: string[];
  expires_at: string | null;
  status: string;
}

const TIER_FEATURES = {
  free: [],
  pro: ['ai_studio', 'telebuy', 'analytics', 'unlimited_rfqs'],
  enterprise: ['ai_studio', 'telebuy', 'analytics', 'unlimited_rfqs', 'api_access', 'white_label', 'sso', 'daily_co_premium'],
};

export function useSubscription() {
  const { currentOrg } = useOrganization();
  const { user } = useAuth();
  
  return useQuery<Subscription | null>({
    queryKey: ['subscription', user?.id, currentOrg?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // Admin org type gets enterprise-level access
      if (currentOrg?.org_type === 'admin') {
        return {
          tier: 'enterprise',
          features: TIER_FEATURES.enterprise,
          expires_at: null,
          status: 'active',
        };
      }
      
      // Query actual subscription from database
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return {
          tier: 'free',
          features: TIER_FEATURES.free,
          expires_at: null,
          status: 'none',
        };
      }
      
      if (!data) {
        return {
          tier: 'free',
          features: TIER_FEATURES.free,
          expires_at: null,
          status: 'none',
        };
      }
      
      // Determine tier from price_id
      // This should match your Stripe price IDs
      const priceId = data.price_id || '';
      let tier: 'free' | 'pro' | 'enterprise' = 'free';
      
      if (priceId.includes('enterprise') || priceId.includes('ent_')) {
        tier = 'enterprise';
      } else if (priceId.includes('pro') || priceId.includes('price_')) {
        tier = 'pro';
      }
      
      return {
        tier,
        features: TIER_FEATURES[tier],
        expires_at: null,
        status: data.status,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useHasFeature(featureKey: string): boolean {
  const { data: subscription } = useSubscription();
  
  // Check if feature is in subscription features array
  if (subscription?.features.includes(featureKey)) {
    return true;
  }
  
  // Enterprise tier gets all features
  if (subscription?.tier === 'enterprise') {
    return true;
  }
  
  return false;
}

export function useSubscriptionTier(): 'free' | 'pro' | 'enterprise' {
  const { data: subscription } = useSubscription();
  return subscription?.tier || 'free';
}
