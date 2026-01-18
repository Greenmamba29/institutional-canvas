import { useOrganization } from '@/context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  tier: 'free' | 'pro' | 'enterprise';
  features: string[];
  expires_at: string | null;
}

export function useSubscription() {
  const { currentOrg } = useOrganization();
  
  return useQuery<Subscription | null>({
    queryKey: ['subscription', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg) return null;
      
      // Check org metadata for subscription tier
      const { data } = await supabase
        .from('organizations')
        .select('metadata')
        .eq('id', currentOrg.id)
        .single();
      
      // Parse metadata (JSONB field)
      const metadata = data?.metadata as any;
      const tier = metadata?.subscription_tier || 'free';
      const features = metadata?.features || [];
      
      return {
        tier,
        features,
        expires_at: metadata?.subscription_expires || null
      };
    },
    enabled: !!currentOrg,
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
