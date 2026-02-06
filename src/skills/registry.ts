/**
 * Skill Registry
 * 
 * Central registry for all available skills.
 * Provides discovery, filtering, and access control.
 */

import type { Skill, SkillMetadata, SkillCategory, SkillContext } from './types';

// Registry of all skills
const SKILL_REGISTRY = new Map<string, Skill<unknown, unknown>>();

/**
 * Register a skill in the registry
 */
export function registerSkill<TInput, TOutput>(skill: Skill<TInput, TOutput>): void {
  if (SKILL_REGISTRY.has(skill.contract.name)) {
    console.warn(`[SkillRegistry] Overwriting existing skill: ${skill.contract.name}`);
  }
  SKILL_REGISTRY.set(skill.contract.name, skill as Skill<unknown, unknown>);
}

/**
 * Get a skill by name
 */
export function getSkill<TInput = unknown, TOutput = unknown>(
  name: string
): Skill<TInput, TOutput> | undefined {
  return SKILL_REGISTRY.get(name) as Skill<TInput, TOutput> | undefined;
}

/**
 * Check if a skill exists
 */
export function hasSkill(name: string): boolean {
  return SKILL_REGISTRY.has(name);
}

/**
 * Get all registered skills
 */
export function getAllSkills(): Skill<unknown, unknown>[] {
  return Array.from(SKILL_REGISTRY.values());
}

/**
 * Get skill metadata for all registered skills
 */
export function getAllSkillMetadata(): SkillMetadata[] {
  return getAllSkills().map(skill => ({
    name: skill.contract.name,
    version: skill.contract.version,
    description: skill.contract.description,
    category: getCategoryFromName(skill.contract.name),
    requiredCapabilities: skill.contract.requiredCapabilities,
    requiredSubscription: skill.contract.requiredSubscription,
    featureFlags: skill.contract.featureFlags,
  }));
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: SkillCategory): Skill<unknown, unknown>[] {
  return getAllSkills().filter(skill => 
    skill.contract.name.startsWith(`${category}.`)
  );
}

/**
 * Get skills available to a user based on context
 */
export function getAvailableSkills(context: SkillContext): Skill<unknown, unknown>[] {
  const tierOrder = { free: 0, pro: 1, enterprise: 2 };
  const userTier = tierOrder[context.subscriptionTier];

  return getAllSkills().filter(skill => {
    // Super admins can only use admin_ops skills
    if (context.isSuperAdmin) {
      return skill.contract.name.startsWith('admin_ops.');
    }

    // Non-admins cannot use admin_ops skills
    if (skill.contract.name.startsWith('admin_ops.')) {
      return false;
    }

    // Check subscription tier
    if (skill.contract.requiredSubscription) {
      const requiredTier = tierOrder[skill.contract.requiredSubscription];
      if (userTier < requiredTier) {
        return false;
      }
    }

    // Check capabilities
    const hasAllCaps = skill.contract.requiredCapabilities.every(
      cap => context.capabilities.includes(cap)
    );
    if (!hasAllCaps) {
      return false;
    }

    return true;
  });
}

/**
 * Extract category from skill name
 */
function getCategoryFromName(name: string): SkillCategory {
  const prefix = name.split('.')[0];
  const validCategories: SkillCategory[] = [
    'telebuy', 'rfq', 'auction', 'deal', 'order', 
    'match', 'threepl', 'carbon', 'admin_ops'
  ];
  
  return validCategories.includes(prefix as SkillCategory) 
    ? (prefix as SkillCategory) 
    : 'admin_ops';
}

/**
 * Skill statistics
 */
export function getRegistryStats(): {
  total: number;
  byCategory: Record<SkillCategory, number>;
} {
  const skills = getAllSkills();
  const byCategory: Record<SkillCategory, number> = {
    telebuy: 0,
    rfq: 0,
    auction: 0,
    deal: 0,
    order: 0,
    match: 0,
    threepl: 0,
    carbon: 0,
    admin_ops: 0,
  };

  for (const skill of skills) {
    const category = getCategoryFromName(skill.contract.name);
    byCategory[category]++;
  }

  return { total: skills.length, byCategory };
}
