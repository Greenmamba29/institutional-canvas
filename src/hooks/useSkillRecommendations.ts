/**
 * useSkillRecommendations Hook
 * 
 * React hook for getting context-aware skill recommendations.
 * Automatically updates based on user context and page location.
 */

import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { recommendSkills, getSkillsForEntity } from '@/skills/recommend';
import type { RecommendationContext, SkillRecommendation, SkillContext } from '@/skills/types';
import type { OnboardingProfile, SubscriptionTier } from '@/policy/types';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback, useMemo } from 'react';

interface UseSkillRecommendationsOptions {
  /** Maximum number of recommendations to return */
  limit?: number;
  /** Whether to automatically refetch on page changes */
  refetchOnNavigate?: boolean;
  /** Enable/disable the query */
  enabled?: boolean;
}

interface UseSkillRecommendationsResult {
  /** Recommended skills */
  recommendations: SkillRecommendation[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Record a user action for better recommendations */
  recordAction: (action: string) => void;
  /** Manually refetch recommendations */
  refetch: () => Promise<void>;
}

/**
 * Hook for getting personalized skill recommendations
 */
export function useSkillRecommendations(
  options: UseSkillRecommendationsOptions = {}
): UseSkillRecommendationsResult {
  const { limit = 5, refetchOnNavigate = true, enabled = true } = options;
  
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const location = useLocation();
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [dealInProgress, setDealInProgress] = useState<string | undefined>();

  // Build recommendation context
  const buildContext = useCallback(async (): Promise<RecommendationContext> => {
    const baseContext = await buildSkillContext(user?.id, currentOrg?.id);
    return {
      ...baseContext,
      currentPage: location.pathname,
      recentActions,
      dealInProgress,
    };
  }, [user?.id, currentOrg?.id, location.pathname, recentActions, dealInProgress]);

  // Query for recommendations
  const {
    data: recommendations = [],
    isLoading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: [
      'skill-recommendations',
      user?.id,
      currentOrg?.id,
      refetchOnNavigate ? location.pathname : undefined,
      recentActions.join(','),
    ],
    queryFn: async () => {
      const context = await buildContext();
      const recs = await recommendSkills(context);
      return recs.slice(0, limit);
    },
    enabled: enabled && !!user,
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
  });

  // Record a user action
  const recordAction = useCallback((action: string) => {
    setRecentActions(prev => {
      const updated = [action, ...prev.filter(a => a !== action)].slice(0, 10);
      return updated;
    });
  }, []);

  // Refetch wrapper
  const refetch = useCallback(async () => {
    await queryRefetch();
  }, [queryRefetch]);

  return {
    recommendations,
    isLoading,
    error: error as Error | null,
    recordAction,
    refetch,
  };
}

/**
 * Hook for getting skills relevant to a specific entity
 */
export function useEntitySkills(
  entityType: 'supplier' | 'rfq' | 'auction' | 'deal' | 'order',
  entityId?: string
) {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  return useQuery({
    queryKey: ['entity-skills', entityType, entityId, user?.id, currentOrg?.id],
    queryFn: async () => {
      const context = await buildSkillContext(user?.id, currentOrg?.id);
      return getSkillsForEntity(entityType, context);
    },
    enabled: !!user && !!entityId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Build skill context from auth state (duplicated for self-containment)
 */
async function buildSkillContext(
  userId?: string,
  orgId?: string
): Promise<SkillContext> {
  if (!userId) {
    return {
      userId: '',
      orgId: '',
      profile: 'buyer' as OnboardingProfile,
      capabilities: [],
      subscriptionTier: 'free' as SubscriptionTier,
      isSuperAdmin: false,
    };
  }

  // Fetch profile
  let profile: OnboardingProfile = 'buyer';
  try {
    const { data } = await supabase.rpc('get_user_profile');
    if (data) profile = data as OnboardingProfile;
  } catch {
    // Use default
  }

  // Fetch super admin status
  let isSuperAdmin = false;
  try {
    const { data } = await supabase.rpc('is_super_admin');
    isSuperAdmin = Boolean(data);
  } catch {
    // Use default
  }

  // Fetch capabilities for profile
  let capabilities: string[] = [];
  try {
    const { data } = await supabase
      .from('profile_capabilities')
      .select('capability_key')
      .eq('profile', profile);
    capabilities = data?.map(c => c.capability_key) || [];
  } catch {
    // Use default
  }

  // Determine subscription tier
  let subscriptionTier: SubscriptionTier = 'free';
  if (orgId) {
    try {
      const { data } = await supabase.rpc('get_user_org_role', { p_org_id: orgId });
      const roleData = data as { subscription_tier?: string } | null;
      if (roleData?.subscription_tier === 'pro' || roleData?.subscription_tier === 'enterprise') {
        subscriptionTier = roleData.subscription_tier as SubscriptionTier;
      }
    } catch {
      // Use default
    }
  }

  return {
    userId,
    orgId: orgId || '',
    profile,
    capabilities,
    subscriptionTier,
    isSuperAdmin,
  };
}
