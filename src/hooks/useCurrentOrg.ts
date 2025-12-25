/**
 * Helper hook for org-scoped operations
 * 
 * Provides currentOrgId and a helper to inject org_id into mutations.
 */

import { useOrganization } from '@/context/OrganizationContext';

/**
 * Returns the current org ID and a helper to add org_id to mutation params
 */
export function useCurrentOrg() {
  const { currentOrg, currentOrgId, isLoading, hasOrganization } = useOrganization();

  /**
   * Adds org_id to the given object if currentOrgId exists
   */
  const withOrgId = <T extends Record<string, unknown>>(data: T): T & { org_id?: string } => {
    if (!currentOrgId) return data;
    return { ...data, org_id: currentOrgId };
  };

  /**
   * Throws if no org is selected
   */
  const requireOrg = (): string => {
    if (!currentOrgId) {
      throw new Error('No organization selected. Please select an organization first.');
    }
    return currentOrgId;
  };

  return {
    currentOrg,
    currentOrgId,
    isLoading,
    hasOrganization,
    withOrgId,
    requireOrg,
  };
}
