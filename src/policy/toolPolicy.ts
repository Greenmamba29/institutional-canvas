/**
 * Tool Policy Enforcement
 * 
 * Mediates all tool calls through the policy layer.
 * Implements deny-by-default and super admin restrictions.
 */

import { TOOL_MANIFEST, isToolKnown } from './toolManifest';
import type { SkillContext, ToolPolicyResult, SubscriptionTier } from './types';

const SUBSCRIPTION_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Check if a tool can be used by a skill in the given context
 * 
 * Enforces:
 * 1. Deny unknown tools (not in manifest)
 * 2. Super admin restriction (admin_ops.* skills only)
 * 3. Super admin requirement for admin tools
 * 4. Skill allowlist check
 * 5. Capability requirement
 * 6. Subscription requirement
 */
export function canUseTool(
  toolName: string,
  skillName: string,
  context: SkillContext
): ToolPolicyResult {
  // 1. Deny unknown tools (deny by default)
  if (!isToolKnown(toolName)) {
    return {
      allowed: false,
      code: 'UNKNOWN_TOOL',
      reason: `Tool "${toolName}" not registered in manifest`,
    };
  }

  const tool = TOOL_MANIFEST[toolName];

  // 2. Super admin restriction - can ONLY use admin_ops.* skills
  if (context.isSuperAdmin) {
    if (!skillName.startsWith('admin_ops.')) {
      return {
        allowed: false,
        code: 'SUPER_ADMIN_WRONG_SKILL',
        reason: 'Super admins can only execute admin_ops.* skills',
      };
    }
  }

  // 3. Check if tool requires super admin
  if (tool.superAdminOnly && !context.isSuperAdmin) {
    return {
      allowed: false,
      code: 'SUPER_ADMIN_ONLY',
      reason: `Tool "${toolName}" requires super admin privileges`,
    };
  }

  // 4. Check if skill is in allowlist
  const isWildcard = tool.allowedSkills.includes('*');
  const isExplicitlyAllowed = tool.allowedSkills.includes(skillName);

  if (!isWildcard && !isExplicitlyAllowed) {
    return {
      allowed: false,
      code: 'SKILL_NOT_ALLOWED',
      reason: `Skill "${skillName}" is not authorized to use tool "${toolName}"`,
    };
  }

  // 5. Check capability requirement
  if (tool.requiresCapability && !context.capabilities.includes(tool.requiresCapability)) {
    return {
      allowed: false,
      code: 'CAPABILITY_DENIED',
      reason: `Capability "${tool.requiresCapability}" required for tool "${toolName}"`,
    };
  }

  // 6. Check subscription requirement
  if (tool.requiresSubscription) {
    const requiredLevel = SUBSCRIPTION_ORDER[tool.requiresSubscription];
    const currentLevel = SUBSCRIPTION_ORDER[context.subscriptionTier];

    if (currentLevel < requiredLevel) {
      return {
        allowed: false,
        code: 'SUBSCRIPTION_REQUIRED',
        reason: `${tool.requiresSubscription} subscription required for tool "${toolName}"`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Batch check multiple tools for a skill
 */
export function canUseTools(
  toolNames: string[],
  skillName: string,
  context: SkillContext
): Map<string, ToolPolicyResult> {
  const results = new Map<string, ToolPolicyResult>();
  
  for (const toolName of toolNames) {
    results.set(toolName, canUseTool(toolName, skillName, context));
  }
  
  return results;
}

/**
 * Get all allowed tools for a skill in the given context
 */
export function getAllowedToolsForSkill(
  skillName: string,
  context: SkillContext
): string[] {
  return Object.keys(TOOL_MANIFEST).filter(toolName => {
    const result = canUseTool(toolName, skillName, context);
    return result.allowed;
  });
}
