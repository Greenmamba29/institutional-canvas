import { useOrganization } from '@/context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';

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
      
      // For demo, return a mock subscription based on org status
      // In production, would query a subscriptions table
      const isProOrg = currentOrg.status === 'active';
      
      return {
        tier: isProOrg ? 'pro' : 'free',
        features: isProOrg ? ['ai_studio', 'telebuy', 'analytics'] : [],
        expires_at: null
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
