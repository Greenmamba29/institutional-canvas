/**
 * Policy Layer Types
 * Core types for the skills-first agent architecture
 */

// Canonical profile types - MUST match database enum exactly
export type OnboardingProfile = 'buyer' | 'supplier' | 'soe' | 'investor';

// UI-friendly labels (for display only)
export const PROFILE_LABELS: Record<OnboardingProfile, string> = {
  buyer: 'Buyer',
  supplier: 'Supplier',
  soe: 'State-Owned Enterprise',
  investor: 'Investor View',
};

// Subscription tiers
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Tool categories for manifest organization
export type ToolCategory =
  | 'supabase.read.public'      // Tables with public RLS
  | 'supabase.read.org_scoped'  // Tables with org-level RLS
  | 'supabase.write.rpc'        // RPC functions only
  | 'external.daily'            // Daily.co API
  | 'external.airtable'         // Airtable API
  | 'external.make'             // Make.com API
  | 'admin_ops';                // Super admin only

// Tool definition in the manifest
export interface ToolDefinition {
  name: string;
  category: ToolCategory;
  description: string;
  allowedSkills: string[];      // Empty = deny by default, '*' = all skills
  requiresCapability?: string;
  requiresSubscription?: 'pro' | 'enterprise';
  superAdminOnly?: boolean;     // If true, ONLY super admin can use
}

// Result of tool policy check
export interface ToolPolicyResult {
  allowed: boolean;
  reason?: string;
  code?: ToolPolicyErrorCode;
}

export type ToolPolicyErrorCode =
  | 'UNKNOWN_TOOL'
  | 'SKILL_NOT_ALLOWED'
  | 'SUPER_ADMIN_ONLY'
  | 'SUPER_ADMIN_WRONG_SKILL'
  | 'CAPABILITY_DENIED'
  | 'SUBSCRIPTION_REQUIRED'
  | 'SYSTEM_READ_ONLY';

// Skill context passed to every skill execution
export interface SkillContext {
  userId: string;
  orgId: string;
  profile: OnboardingProfile;
  capabilities: string[];
  subscriptionTier: SubscriptionTier;
  isSuperAdmin: boolean;
}

// Policy decision for audit logging
export interface PolicyDecision {
  timestamp: Date;
  toolName: string;
  skillName: string;
  userId: string;
  orgId: string;
  allowed: boolean;
  reason?: string;
  code?: ToolPolicyErrorCode;
}
