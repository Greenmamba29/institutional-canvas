/**
 * RoleContext - Role and permissions management
 * 
 * Provides org type and server role information for UI gating.
 * Admin role bypasses all paywall checks (unlimited access).
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from './OrganizationContext';

export type OrgType = 'admin' | 'supplier' | 'buyer' | 'soe' | null;
export type ServerRole = 'owner' | 'admin' | 'member' | null;
export type UILayoutPreference = 'admin' | 'supplier' | 'buyer' | 'soe';

interface RoleContextType {
  orgType: OrgType;
  serverRole: ServerRole;
  isLoadingRole: boolean;
  uiLayoutPreference: UILayoutPreference;
  setUILayoutPreference: (layout: UILayoutPreference) => void;
  canSwitchLayouts: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { currentOrg, isLoading, viewMode } = useOrganization();
  const [uiLayoutPreference, setUILayoutPreference] = useState<UILayoutPreference>('admin');

  // Map viewMode to orgType
  const orgType: OrgType = viewMode === 'admin' ? 'admin' : viewMode === 'supplier' ? 'supplier' : 'buyer';
  const canSwitchLayouts = viewMode === 'admin';

  // Sync UI preference to actual org type for non-admins
  useEffect(() => {
    if (viewMode && viewMode !== 'admin') {
      setUILayoutPreference(viewMode as UILayoutPreference);
    }
  }, [viewMode]);

  return (
    <RoleContext.Provider value={{
      orgType,
      serverRole: null, // Will be populated from org_members in future
      isLoadingRole: isLoading,
      uiLayoutPreference,
      setUILayoutPreference,
      canSwitchLayouts,
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
      isLoadingRole: false,
      uiLayoutPreference: 'admin' as UILayoutPreference,
      setUILayoutPreference: () => {},
      canSwitchLayouts: true,
    };
  }
  return context;
}

export function useIsAdmin(): boolean {
  const { orgType } = useRole();
  return orgType === 'admin';
}

export function useEffectiveLayout(): UILayoutPreference {
  const { orgType, uiLayoutPreference, canSwitchLayouts } = useRole();
  return canSwitchLayouts ? uiLayoutPreference : (orgType as UILayoutPreference) ?? 'buyer';
}
