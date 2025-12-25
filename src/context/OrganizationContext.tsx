import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useMyOrganizations } from '@/hooks/useOrganizations';
import { Database } from '@/integrations/supabase/types';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface OrganizationContextType {
  currentOrg: Organization | null;
  currentOrgId: string | null;
  organizations: Organization[];
  isLoading: boolean;
  hasOrganization: boolean;
  switchOrg: (orgId: string) => void;
  refetch: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

const ORG_STORAGE_KEY = 'lithium-lux-current-org';

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: organizations = [], isLoading: orgsLoading, refetch } = useMyOrganizations();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Load saved org preference on mount and when organizations change
  useEffect(() => {
    if (organizations.length > 0) {
      const savedOrgId = localStorage.getItem(ORG_STORAGE_KEY);
      const savedOrg = savedOrgId 
        ? organizations.find(org => org.id === savedOrgId) 
        : null;
      
      // Use saved org if valid, otherwise use first org
      setCurrentOrg(savedOrg || organizations[0]);
    } else {
      setCurrentOrg(null);
    }
  }, [organizations]);

  const switchOrg = useCallback((orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      localStorage.setItem(ORG_STORAGE_KEY, orgId);
    }
  }, [organizations]);

  const isLoading = authLoading || (isAuthenticated && orgsLoading);
  const hasOrganization = organizations.length > 0;
  const currentOrgId = currentOrg?.id ?? null;

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        currentOrgId,
        organizations,
        isLoading,
        hasOrganization,
        switchOrg,
        refetch,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
