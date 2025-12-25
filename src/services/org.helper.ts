/**
 * Organization Helper Functions
 * 
 * Utility functions for multi-tenant operations.
 */

/**
 * Injects org_id into a data object
 */
export function withOrgId<T extends Record<string, unknown>>(
  data: T, 
  orgId: string | null | undefined
): T & { org_id?: string } {
  if (!orgId) return data;
  return { ...data, org_id: orgId };
}

/**
 * Validates that an org ID is present
 */
export function requireOrgId(orgId: string | null | undefined): string {
  if (!orgId) {
    throw new Error('Organization ID is required for this operation');
  }
  return orgId;
}
