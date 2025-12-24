import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth0 } from '@auth0/auth0-react';

// UI view mode - only used for UI display preferences, NOT for authorization
export type ViewMode = 'admin' | 'supplier' | 'buyer';

// Server-validated role from org_members table
export type ServerRole = 'owner' | 'admin' | 'member' | null;

interface RoleContextType {
  // UI view mode (can be switched by user for different views, NOT for security)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // Server-validated role from org_members (used for actual authorization display)
  serverRole: ServerRole;
  isLoadingRole: boolean;
  
  // Legacy alias for backward compatibility - maps to viewMode
  role: ViewMode;
  setRole: (role: ViewMode) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth0();
  const { currentOrg } = useOrganization();
  
  // UI view mode - stored in localStorage for UI preference only
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const stored = localStorage.getItem('lithium-lux-view-mode');
    return (stored as ViewMode) || 'buyer';
  });
  
  // Server-validated role from org_members table
  const [serverRole, setServerRole] = useState<ServerRole>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  // Persist view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('lithium-lux-view-mode', viewMode);
  }, [viewMode]);

  // Fetch server-validated role from org_members when org changes
  useEffect(() => {
    const fetchServerRole = async () => {
      if (!isAuthenticated || !user?.sub || !currentOrg?.id) {
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
          .eq('user_id', user.sub)
          .eq('status', 'active')
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
  }, [isAuthenticated, user?.sub, currentOrg?.id]);

  return (
    <RoleContext.Provider value={{ 
      viewMode, 
      setViewMode,
      serverRole,
      isLoadingRole,
      // Legacy aliases for backward compatibility
      role: viewMode,
      setRole: setViewMode,
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

// Helper to check if user has admin-level access (owner or admin role)
export function useIsAdmin(): boolean {
  const { serverRole, isLoadingRole } = useRole();
  if (isLoadingRole) return false;
  return serverRole === 'owner' || serverRole === 'admin';
}

// Helper to check if user is organization owner
export function useIsOwner(): boolean {
  const { serverRole, isLoadingRole } = useRole();
  if (isLoadingRole) return false;
  return serverRole === 'owner';
}
