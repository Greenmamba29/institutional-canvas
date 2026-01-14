import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Organization type from database - determines which navigation/dashboard to show.
 * This is SERVER-VALIDATED and should be used for navigation gating.
 */
export type OrgType = 'admin' | 'supplier' | 'buyer' | 'soe' | null;

/**
 * UI layout preference - ONLY for admin override/testing.
 * @deprecated For navigation gating, use orgType from organization context.
 * This is stored in localStorage and can be manipulated by users.
 * Regular users should NOT use this - only admins for testing different views.
 */
export type UILayoutPreference = 'admin' | 'supplier' | 'buyer' | 'soe';

/**
 * Server-validated role from org_members table.
 * This is the ONLY role that should be used for authorization decisions.
 * It is fetched from the database and enforced by RLS policies.
 */
export type ServerRole = 'owner' | 'admin' | 'member' | null;

interface RoleContextType {
  /**
   * Organization type from database - determines navigation layout.
   * Use this for navigation gating (what tabs to show).
   */
  orgType: OrgType;
  
  /**
   * UI layout preference - ONLY for admin override/testing.
   * @deprecated For regular users, navigation should use orgType.
   * Only admins can use this to test different dashboard views.
   */
  uiLayoutPreference: UILayoutPreference;
  setUILayoutPreference: (layout: UILayoutPreference) => void;
  
  /**
   * Server-validated role from org_members table (owner/admin/member).
   * Use this for all authorization-related UI decisions.
   */
  serverRole: ServerRole;
  isLoadingRole: boolean;
  
  /**
   * Whether the current user can switch layouts (admin org only).
   */
  canSwitchLayouts: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { currentOrg } = useOrganization();
  
  // Derive orgType from current organization's org_type field
  const orgType: OrgType = currentOrg?.org_type as OrgType ?? null;
  
  // Only admin org_type users can switch layouts (for testing purposes)
  const canSwitchLayouts = orgType === 'admin';
  
  // UI layout preference - stored in localStorage for admin override only
  // WARNING: This should ONLY be used by admins for testing different views
  const [uiLayoutPreference, setUILayoutPreference] = useState<UILayoutPreference>(() => {
    const stored = localStorage.getItem('lithium-lux-ui-layout');
    if (stored === 'admin' || stored === 'supplier' || stored === 'buyer' || stored === 'soe') {
      return stored;
    }
    return 'buyer';
  });
  
  // Server-validated role from org_members table - USE THIS FOR AUTHORIZATION
  const [serverRole, setServerRole] = useState<ServerRole>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Persist UI layout preference to localStorage
  useEffect(() => {
    localStorage.setItem('lithium-lux-ui-layout', uiLayoutPreference);
  }, [uiLayoutPreference]);

  // Fetch server-validated role from org_members when org changes
  useEffect(() => {
    const fetchServerRole = async () => {
      if (!isAuthenticated || !user?.id || !currentOrg?.id) {
        setServerRole(null);
        setIsLoadingRole(false);
        return;
      }

      setIsLoadingRole(true);
      try {
        const { data, error } = await supabase
          .from('org_members')
          .select('role')
          .eq('org_id', currentOrg.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setServerRole(null);
        } else if (data) {
          // Map org_members.role to ServerRole
          const role = data.role as string;
          if (role === 'owner' || role === 'admin' || role === 'member') {
            setServerRole(role);
          } else {
            setServerRole('member'); // Default fallback
          }
        } else {
          setServerRole(null);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        setServerRole(null);
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchServerRole();
  }, [isAuthenticated, user?.id, currentOrg?.id]);

  return (
    <RoleContext.Provider value={{ 
      orgType,
      uiLayoutPreference, 
      setUILayoutPreference,
      serverRole,
      isLoadingRole,
      canSwitchLayouts,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}

/**
 * Helper to check if user has admin-level access (owner or admin role).
 * Uses server-validated role - safe for authorization decisions.
 */
export function useIsAdmin(): boolean {
  const { serverRole, isLoadingRole } = useRole();
  if (isLoadingRole) return false;
  return serverRole === 'owner' || serverRole === 'admin';
}

/**
 * Helper to check if user is organization owner.
 * Uses server-validated role - safe for authorization decisions.
 */
export function useIsOwner(): boolean {
  const { serverRole, isLoadingRole } = useRole();
  if (isLoadingRole) return false;
  return serverRole === 'owner';
}

/**
 * Helper to get the effective layout type for navigation.
 * For admin orgs, respects uiLayoutPreference for testing.
 * For all other orgs, uses the actual org_type.
 */
export function useEffectiveLayout(): OrgType {
  const { orgType, uiLayoutPreference, canSwitchLayouts } = useRole();
  
  // Admin orgs can use the UI switcher for testing different views
  if (canSwitchLayouts) {
    return uiLayoutPreference as OrgType;
  }
  
  // All other orgs use their actual org_type
  return orgType;
}
