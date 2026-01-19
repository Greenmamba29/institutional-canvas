/**
 * Server-Side Role Validation Hook
 * 
 * Uses the get_user_org_role RPC to validate roles server-side,
 * preventing client-side manipulation attacks.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ServerRole {
  org_id: string;
  org_type: 'admin' | 'supplier' | 'buyer' | 'soe';
  org_name: string;
  member_role: 'owner' | 'admin' | 'member';
  subscription_tier: 'free' | 'pro' | 'enterprise' | 'active';
}

export function useServerRole(orgId?: string) {
  const { user } = useAuth();
  
  return useQuery<ServerRole | null>({
    queryKey: ['serverRole', user?.id, orgId],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.rpc('get_user_org_role', {
        p_user_id: user.id,
        p_org_id: orgId || null,
      });
      
      if (error) throw new Error(error.message);
      
      // RPC returns array, take first row
      const result = Array.isArray(data) ? data[0] : data;
      return result as ServerRole | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useServerRoles() {
  const { user } = useAuth();
  
  return useQuery<ServerRole[]>({
    queryKey: ['serverRoles', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.rpc('get_user_org_role', {
        p_user_id: user.id,
        p_org_id: null, // Get all orgs
      });
      
      if (error) throw new Error(error.message);
      return (data || []) as ServerRole[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Check if user has a specific org type (server-validated)
 */
export function useHasOrgType(orgType: 'admin' | 'supplier' | 'buyer' | 'soe') {
  const { data: roles, isLoading } = useServerRoles();
  
  const hasOrgType = roles?.some(r => r.org_type === orgType) ?? false;
  const isAdmin = roles?.some(r => r.org_type === 'admin') ?? false;
  
  return {
    hasAccess: hasOrgType || isAdmin,
    isLoading,
    isAdmin,
  };
}

/**
 * Check if user has Pro or Enterprise subscription (server-validated)
 */
export function useHasSubscription(requiredTier: 'pro' | 'enterprise') {
  const { data: role, isLoading } = useServerRole();
  
  if (isLoading || !role) return { hasAccess: false, isLoading, tier: 'free' as const };
  
  // Admin org type bypasses subscription checks
  if (role.org_type === 'admin') {
    return { hasAccess: true, isLoading: false, tier: 'enterprise' as const };
  }
  
  const tier = role.subscription_tier;
  const isPro = tier === 'pro' || tier === 'active';
  const isEnterprise = tier === 'enterprise';
  const hasAccess = isEnterprise || (requiredTier === 'pro' && isPro);
  
  return { hasAccess, isLoading: false, tier: isEnterprise ? 'enterprise' : isPro ? 'pro' : 'free' as const };
}
