/**
 * Skill Recommendation Engine
 * 
 * Provides context-aware skill discovery and recommendations.
 * Helps users find relevant actions based on their current state.
 */

import type { SkillContext, SkillRecommendation, RecommendationContext } from './types';
import { getAllSkills } from './registry';
import { checkFeatureFlag } from '@/policy/featureFlags';

/**
 * Get recommended skills based on user context
 * 
 * @param context - Extended context including current page and recent actions
 * @returns Array of skill recommendations sorted by priority
 */
export async function recommendSkills(
  context: RecommendationContext
): Promise<SkillRecommendation[]> {
  const recommendations: SkillRecommendation[] = [];
  const skills = getAllSkills();
  const tierOrder = { free: 0, pro: 1, enterprise: 2 };

  for (const skill of skills) {
    // 1. Check feature flags
    if (skill.contract.featureFlags && skill.contract.featureFlags.length > 0) {
      const flagChecks = await Promise.all(
        skill.contract.featureFlags.map(f => checkFeatureFlag(f, context.orgId))
      );
      if (!flagChecks.every(Boolean)) continue;
    }

    // 2. Check subscription tier
    if (skill.contract.requiredSubscription) {
      const required = tierOrder[skill.contract.requiredSubscription];
      const current = tierOrder[context.subscriptionTier];
      if (current < required) continue;
    }

    // 3. Check capabilities
    const hasAllCaps = skill.contract.requiredCapabilities.every(
      cap => context.capabilities.includes(cap)
    );
    if (!hasAllCaps) continue;

    // 4. Super admin restriction
    if (context.isSuperAdmin && !skill.contract.name.startsWith('admin_ops.')) {
      continue; // Super admins can only see admin_ops skills
    }
    if (!context.isSuperAdmin && skill.contract.name.startsWith('admin_ops.')) {
      continue; // Non-admins can't see admin_ops skills
    }

    // 5. Calculate relevance based on context
    const priority = calculateRelevance(skill.contract.name, context);
    if (priority > 0) {
      recommendations.push({
        skillName: skill.contract.name,
        displayName: formatSkillName(skill.contract.name),
        description: skill.contract.description,
        reason: getRecommendationReason(skill.contract.name, context),
        priority,
      });
    }
  }

  // Sort by priority descending, return top 5
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
}

/**
 * Calculate skill relevance score based on context
 */
function calculateRelevance(skillName: string, context: RecommendationContext): number {
  let score = 5; // Base score

  // Page-based boosting
  const pageBoosts: Record<string, string[]> = {
    '/marketplace': ['rfq.create', 'rfq.list'],
    '/telebuy': ['telebuy.start', 'telebuy.list'],
    '/auctions': ['auction.bid', 'auction.list', 'auction.settle'],
    '/rfqs': ['rfq.create', 'rfq.list', 'rfq.respond'],
    '/deals': ['deal.award', 'deal.view', 'telebuy.start'],
    '/admin': ['admin_ops.audit', 'admin_ops.flags', 'admin_ops.auction_control'],
  };

  for (const [page, skills] of Object.entries(pageBoosts)) {
    if (context.currentPage.startsWith(page) && skills.includes(skillName)) {
      score += 3;
    }
  }

  // Recent action boosting
  const actionBoosts: Record<string, string[]> = {
    'viewed_supplier': ['telebuy.start', 'rfq.create'],
    'created_rfq': ['auction.bid', 'rfq.respond'],
    'received_bid': ['deal.award', 'telebuy.start'],
    'awarded_deal': ['telebuy.start', 'order.create'],
    'viewed_auction': ['auction.bid', 'auction.list'],
  };

  for (const action of context.recentActions) {
    const boostedSkills = actionBoosts[action];
    if (boostedSkills?.includes(skillName)) {
      score += 2;
    }
  }

  // Active deal boosting
  if (context.dealInProgress) {
    if (skillName.startsWith('deal.')) score += 4;
    if (skillName === 'telebuy.start') score += 3;
    if (skillName === 'order.create') score += 2;
  }

  // Reduce score for rarely used categories if no context match
  if (score === 5) {
    if (skillName.startsWith('threepl.') || skillName.startsWith('carbon.')) {
      score -= 2;
    }
  }

  return score;
}

/**
 * Generate human-readable reason for recommendation
 */
function getRecommendationReason(skillName: string, context: RecommendationContext): string {
  // Context-specific reasons
  if (skillName === 'telebuy.start' && context.recentActions.includes('viewed_supplier')) {
    return 'Start a video call with the supplier you just viewed';
  }
  if (skillName === 'rfq.create' && context.currentPage.startsWith('/marketplace')) {
    return 'Create an RFQ for products you are browsing';
  }
  if (skillName === 'auction.bid' && context.currentPage.startsWith('/auctions')) {
    return 'Place a bid on available auctions';
  }
  if (skillName.startsWith('deal.') && context.dealInProgress) {
    return 'Manage your active deal';
  }

  // Page-based reasons
  if (context.currentPage.startsWith('/telebuy') && skillName.startsWith('telebuy.')) {
    return 'Available TeleBuy action';
  }
  if (context.currentPage.startsWith('/rfqs') && skillName.startsWith('rfq.')) {
    return 'RFQ operation for this page';
  }

  // Role-based reasons
  if (skillName.startsWith('admin_ops.')) {
    return 'Admin operation available';
  }

  // Default reasons by skill type
  const defaultReasons: Record<string, string> = {
    'telebuy.start': 'Start a video negotiation session',
    'telebuy.list': 'View your scheduled TeleBuy sessions',
    'rfq.create': 'Request quotes from suppliers',
    'rfq.list': 'View your RFQs and responses',
    'rfq.respond': 'Respond to an RFQ as a supplier',
    'auction.bid': 'Place a bid on an auction',
    'auction.list': 'View available auctions',
    'auction.settle': 'Settle a completed auction',
    'deal.award': 'Award a deal to a bidder',
    'order.create': 'Create a purchase order',
  };

  return defaultReasons[skillName] || 'Recommended based on your activity';
}

/**
 * Format skill name for display
 */
function formatSkillName(skillName: string): string {
  const parts = skillName.split('.');
  if (parts.length !== 2) return skillName;

  const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const action = parts[1]
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return `${category} → ${action}`;
}

/**
 * Get skills relevant to a specific entity
 */
export function getSkillsForEntity(
  entityType: 'supplier' | 'rfq' | 'auction' | 'deal' | 'order',
  context: SkillContext
): SkillRecommendation[] {
  const skills = getAllSkills();
  const entitySkillMap: Record<string, string[]> = {
    supplier: ['telebuy.start', 'rfq.create'],
    rfq: ['rfq.respond', 'deal.award'],
    auction: ['auction.bid', 'auction.settle'],
    deal: ['telebuy.start', 'order.create', 'deal.award'],
    order: ['order.view', 'order.update'],
  };

  const relevantSkillNames = entitySkillMap[entityType] || [];
  const tierOrder = { free: 0, pro: 1, enterprise: 2 };

  return relevantSkillNames
    .map(skillName => {
      const skill = skills.find(s => s.contract.name === skillName);
      if (!skill) return null;

      // Check access
      if (skill.contract.requiredSubscription) {
        const required = tierOrder[skill.contract.requiredSubscription];
        const current = tierOrder[context.subscriptionTier];
        if (current < required) return null;
      }

      const hasAllCaps = skill.contract.requiredCapabilities.every(
        cap => context.capabilities.includes(cap)
      );
      if (!hasAllCaps) return null;

      // Super admin checks
      if (context.isSuperAdmin && !skillName.startsWith('admin_ops.')) return null;
      if (!context.isSuperAdmin && skillName.startsWith('admin_ops.')) return null;

      return {
        skillName,
        displayName: formatSkillName(skillName),
        description: skill.contract.description,
        reason: `Action for ${entityType}`,
        priority: 5,
      };
    })
    .filter((rec): rec is SkillRecommendation => rec !== null);
}
