/**
 * Skills Layer
 * 
 * Claude Agent SDK skills architecture for LithiumBuy.
 * Skills are modular, policy-enforced agent capabilities.
 */

// Types
export type {
  SkillContext,
  SkillContract,
  SkillResult,
  Skill,
  SkillMetadata,
  SkillCategory,
  ToolCallRecord,
  SkillInvocationRecord,
  SkillRecommendation,
  RecommendationContext,
} from './types';

// Registry
export {
  registerSkill,
  getSkill,
  hasSkill,
  getAllSkills,
  getAllSkillMetadata,
  getSkillsByCategory,
  getAvailableSkills,
  getRegistryStats,
} from './registry';

// Audit
export {
  logSkillInvocation,
  hashInput,
  logSkillEvent,
  createToolCallTracker,
} from './audit';
