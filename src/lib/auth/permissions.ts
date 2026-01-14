/**
 * Role-Based Permissions System
 * 
 * Defines permissions for different user roles.
 * Admin role has unlimited access (bypasses all paywalls).
 */

import { ViewMode } from '@/context/OrganizationContext';

export type UserRole = 'admin' | 'supplier' | 'buyer' | 'soe' | 'enterprise_buyer';

export interface RolePermissions {
  canAccessMarketplace: boolean;
  canAccessMessages: boolean;
  canAccessAnalytics: boolean;
  canAccessAIStudio: boolean; // Admin bypasses paywall
  canAccessDataHub: boolean; // Admin bypasses paywall
  canManageOrg: boolean;
  canAccessSupplierRole?: boolean; // SOE-specific: can also be supplier
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessMarketplace: true,
    canAccessMessages: true,
    canAccessAnalytics: true,
    canAccessAIStudio: true, // UNLIMITED - no subscription required
    canAccessDataHub: true, // UNLIMITED - no subscription required
    canManageOrg: true,
  },
  supplier: {
    canAccessMarketplace: false, // Competitive moat - suppliers can't see competitors
    canAccessMessages: true,
    canAccessAnalytics: true,
    canAccessAIStudio: false, // Requires Pro subscription
    canAccessDataHub: false, // Requires Pro subscription
    canManageOrg: false,
  },
  buyer: {
    canAccessMarketplace: true,
    canAccessMessages: false,
    canAccessAnalytics: false,
    canAccessAIStudio: false, // Requires Pro subscription
    canAccessDataHub: false, // Requires Pro subscription
    canManageOrg: false,
  },
  soe: {
    // SOE has same access as Buyer, but with enhanced supplier capability
    canAccessMarketplace: true,
    canAccessMessages: false,
    canAccessAnalytics: false,
    canAccessAIStudio: false, // Requires Pro subscription
    canAccessDataHub: false, // Requires Pro subscription
    canManageOrg: false,
    canAccessSupplierRole: true, // UNIQUE: SOEs can also be suppliers
  },
  enterprise_buyer: {
    // Enterprise Buyer gets volume discounts and priority support
    canAccessMarketplace: true,
    canAccessMessages: false,
    canAccessAnalytics: true, // Enhanced analytics
    canAccessAIStudio: false, // Requires Pro subscription (with volume discount)
    canAccessDataHub: false, // Requires Pro subscription (with volume discount)
    canManageOrg: true,
  },
};

/**
 * Get permissions for a given role/viewMode
 */
export function getPermissions(viewMode: ViewMode): RolePermissions {
  // Map ViewMode to UserRole
  const roleMap: Record<ViewMode, UserRole> = {
    admin: 'admin',
    supplier: 'supplier',
    buyer: 'buyer',
  };

  const role = roleMap[viewMode] || 'buyer';
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user can access a specific feature
 * Also checks org_type for SOE and enterprise_buyer special cases
 */
export function canAccessFeature(
  viewMode: ViewMode,
  feature: 'marketplace' | 'messages' | 'analytics' | 'ai_studio' | 'data_hub',
  orgType?: string | null
): boolean {
  const permissions = getPermissions(viewMode, orgType);

  switch (feature) {
    case 'marketplace':
      return permissions.canAccessMarketplace;
    case 'messages':
      return permissions.canAccessMessages;
    case 'analytics':
      return permissions.canAccessAnalytics;
    case 'ai_studio':
      return permissions.canAccessAIStudio;
    case 'data_hub':
      return permissions.canAccessDataHub;
    default:
      return false;
  }
}
