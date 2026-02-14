/**
 * Subscription Tier Hook
 * Returns the current org's subscription tier for feature gating
 *
 * Used by market-intel, airtable-crud, and other subscription-gated services
 * to determine the appropriate tier when calling Edge Functions.
 */

import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export function useSubscriptionTier(): SubscriptionTier {
  const { currentOrgId } = useCurrentOrg();

  const { data } = useQuery({
    queryKey: ['subscription-tier', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return 'free';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('subscriptions')
        .select('tier')
        .eq('org_id', currentOrgId)
        .eq('status', 'active')
        .maybeSingle();
      return (data?.tier as SubscriptionTier) || 'free';
    },
    enabled: !!currentOrgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return data || 'free';
}
