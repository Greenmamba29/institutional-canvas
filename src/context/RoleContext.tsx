/**
 * RoleContext - Role and permissions management
 * 
 * Uses server-side RPC (get_user_org_role) for secure role validation.
 * Admin role bypasses all paywall checks (unlimited access).
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type OrgType = 'admin' | 'supplier' | 'buyer' | 'soe' | null;
export type ServerRole = 'owner' | 'admin' | 'member' | null;
export type UILayoutPreference = 'admin' | 'supplier' | 'buyer' | 'soe';

interface ServerRoleData {
  org_type: string;
  member_role: string;
  subscription_tier: string | null;
}

interface RoleContextType {
  orgType: OrgType;
  serverRole: ServerRole;
  subscriptionTier: string | null;
  isLoadingRole: boolean;
  uiLayoutPreference: UILayoutPreference;
  setUILayoutPreference: (layout: UILayoutPreference) => void;
  canSwitchLayouts: boolean;
  refetchRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { currentOrg, isLoading: orgLoading, viewMode } = useOrganization();
  const { user, isLoading: authLoading } = useAuth();
  
  const [serverRoleData, setServerRoleData] = useState<ServerRoleData | null>(null);
  const [isLoadingServerRole, setIsLoadingServerRole] = useState(false);
  const [uiLayoutPreference, setUILayoutPreference] = useState<UILayoutPreference>('admin');

  // Fetch server-validated role
  const fetchServerRole = async () => {
    if (!user || !currentOrg?.id) {
      setServerRoleData(null);
      return;
    }
    
    setIsLoadingServerRole(true);
    try {
      const { data, error } = await supabase.rpc('get_user_org_role', {
        p_user_id: user.id,
        p_org_id: currentOrg.id,
      });
      
      if (error) {
        console.error('Error fetching server role:', error);
        setServerRoleData(null);
      } else if (data) {
        setServerRoleData(data as unknown as ServerRoleData);
      }
    } catch (err) {
      console.error('Failed to fetch server role:', err);
      setServerRoleData(null);
    } finally {
      setIsLoadingServerRole(false);
    }
  };

  // Fetch role when user or org changes
  useEffect(() => {
    fetchServerRole();
  }, [user?.id, currentOrg?.id]);

  // Map viewMode to orgType (fallback if no server data)
  const orgType: OrgType = serverRoleData?.org_type as OrgType 
    ?? (viewMode === 'admin' ? 'admin' : viewMode === 'supplier' ? 'supplier' : 'buyer');
  
  const serverRole: ServerRole = serverRoleData?.member_role as ServerRole ?? null;
  const subscriptionTier = serverRoleData?.subscription_tier ?? null;
  
  const canSwitchLayouts = orgType === 'admin' || serverRole === 'admin' || serverRole === 'owner';

  // Sync UI preference to actual org type for non-admins
  useEffect(() => {
    if (viewMode && viewMode !== 'admin' && !canSwitchLayouts) {
      setUILayoutPreference(viewMode as UILayoutPreference);
    }
  }, [viewMode, canSwitchLayouts]);

  return (
    <RoleContext.Provider value={{
      orgType,
      serverRole,
      subscriptionTier,
      isLoadingRole: authLoading || orgLoading || isLoadingServerRole,
      uiLayoutPreference,
      setUILayoutPreference,
      canSwitchLayouts,
      refetchRole: fetchServerRole,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    // Return safe defaults if outside provider
    return {
      orgType: 'admin' as OrgType,
      serverRole: null,
      subscriptionTier: null,
      isLoadingRole: false,
      uiLayoutPreference: 'admin' as UILayoutPreference,
      setUILayoutPreference: () => {},
      canSwitchLayouts: true,
      refetchRole: async () => {},
    };
  }
  return context;
}

export function useIsAdmin(): boolean {
  const { orgType, serverRole } = useRole();
  return orgType === 'admin' || serverRole === 'admin' || serverRole === 'owner';
}

export function useEffectiveLayout(): UILayoutPreference {
  const { orgType, uiLayoutPreference, canSwitchLayouts } = useRole();
  return canSwitchLayouts ? uiLayoutPreference : (orgType as UILayoutPreference) ?? 'buyer';
}

export function useHasSubscription(requiredTier: 'free' | 'pro' | 'enterprise' = 'pro'): boolean {
  const { subscriptionTier, orgType, serverRole } = useRole();
  
  // Admins bypass subscription checks
  if (orgType === 'admin' || serverRole === 'admin' || serverRole === 'owner') {
    return true;
  }
  
  if (requiredTier === 'free') return true;
  
  const tierLevel: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
  const userTierLevel = tierLevel[subscriptionTier ?? 'free'] ?? 0;
  const requiredTierLevel = tierLevel[requiredTier];
  
  return userTierLevel >= requiredTierLevel;
}