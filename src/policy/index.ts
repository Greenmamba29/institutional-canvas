/**
 * Policy Layer
 * 
 * Centralized policy enforcement for the skills-first agent architecture.
 * All tool calls and capability checks flow through this layer.
 */

// Types
export type {
  OnboardingProfile,
  SubscriptionTier,
  ToolCategory,
  ToolDefinition,
  ToolPolicyResult,
  ToolPolicyErrorCode,
  SkillContext,
  PolicyDecision,
} from './types';

export { PROFILE_LABELS } from './types';

// Tool Manifest
export {
  TOOL_MANIFEST,
  isToolKnown,
  getToolDefinition,
  getToolsByCategory,
  getToolsForSkill,
} from './toolManifest';

// Tool Policy
export {
  canUseTool,
  canUseTools,
  getAllowedToolsForSkill,
} from './toolPolicy';

// Kill Switch
export {
  isSystemReadOnly,
  invalidateKillSwitchCache,
  subscribeToKillSwitch,
  assertNotReadOnly,
  ReadOnlyError,
} from './killSwitch';

// Capability Policy
export {
  hasCapability,
  hasAllCapabilities,
  hasAnyCapability,
  getUserProfile,
  isSuperAdmin,
  getSubscriptionTier,
  invalidateCapabilityCache,
  MARKETPLACE_PROFILES,
  TELEBUY_PROFILES,
  canProfileUseTelebuy,
  canProfileUseMarketplace,
} from './capabilityPolicy';

// Audit
export {
  logPolicyDecision,
  createPolicyDecision,
  forceFlushAuditBuffer,
} from './audit';
