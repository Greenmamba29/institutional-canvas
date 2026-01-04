import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * UI layout preference - ONLY for switching between UI layouts/views.
 * This is stored in localStorage and can be manipulated by users.
 * 
 * @warning DO NOT use this for authorization decisions.
 * Use serverRole (fetched from database) for any security-related logic.
 * This is purely cosmetic - determines which dashboard/navigation to show.
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
   * UI layout preference - for switching between different UI layouts.
   * @warning NOT for security/authorization. Use serverRole instead.
   * This is a user-controlled cosmetic preference stored in localStorage.
   */
  uiLayoutPreference: UILayoutPreference;
  setUILayoutPreference: (layout: UILayoutPreference) => void;
  
  /**
   * Server-validated role from org_members table.
   * Use this for all authorization-related UI decisions.
   */
  serverRole: ServerRole;
  isLoadingRole: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const { currentOrg } = useOrganization();
  
  // UI layout preference - stored in localStorage for UI preference only
  // WARNING: This is user-controlled and should NEVER be used for authorization
  // It only determines which dashboard layout and navigation to display
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
      uiLayoutPreference, 
      setUILayoutPreference,
      serverRole,
      isLoadingRole,
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
