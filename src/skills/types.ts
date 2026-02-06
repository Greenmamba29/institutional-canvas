/**
 * Skills Layer Types
 * 
 * Core types for the Claude Agent SDK skills architecture.
 * Skills are modular, testable, and policy-enforced agent capabilities.
 */

import { z } from 'zod';
import type { SkillContext as PolicySkillContext } from '@/policy/types';

// Re-export SkillContext from policy for convenience
export type SkillContext = PolicySkillContext;

/**
 * Skill contract definition
 * Defines the interface for a skill including inputs, outputs, and requirements
 */
export interface SkillContract<TInput = unknown, TOutput = unknown> {
  /** Unique skill identifier (e.g., 'telebuy.start') */
  name: string;
  
  /** Semantic version */
  version: string;
  
  /** Human-readable description */
  description: string;
  
  /** Zod schema for input validation */
  inputSchema: z.ZodSchema<TInput>;
  
  /** Zod schema for output validation */
  outputSchema: z.ZodSchema<TOutput>;
  
  /** Capabilities required to execute this skill */
  requiredCapabilities: string[];
  
  /** Tools this skill is allowed to use */
  requiredTools: string[];
  
  /** Minimum subscription tier required */
  requiredSubscription?: 'pro' | 'enterprise';
  
  /** Feature flags that can disable this skill */
  featureFlags?: string[];
  
  /** Maximum execution time in milliseconds */
  maxExecutionMs?: number;
}

/**
 * Skill execution result
 */
export interface SkillResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  /** Audit ID for tracking */
  auditId?: string;
}

/**
 * Skill implementation
 */
export interface Skill<TInput = unknown, TOutput = unknown> {
  /** The skill's contract */
  contract: SkillContract<TInput, TOutput>;
  
  /** Execute the skill */
  execute: (input: TInput, context: SkillContext) => Promise<SkillResult<TOutput>>;
}

/**
 * Skill metadata for discovery
 */
export interface SkillMetadata {
  name: string;
  version: string;
  description: string;
  category: SkillCategory;
  requiredCapabilities: string[];
  requiredSubscription?: 'pro' | 'enterprise';
  featureFlags?: string[];
}

/**
 * Skill categories for organization
 */
export type SkillCategory =
  | 'telebuy'      // Video negotiation
  | 'rfq'          // Request for quote
  | 'auction'      // Auctions and bidding
  | 'deal'         // Deal management
  | 'order'        // Order management
  | 'match'        // AI matching
  | 'threepl'      // 3PL logistics
  | 'carbon'       // Carbon calculator
  | 'admin_ops';   // Super admin only

/**
 * Tool call record for audit
 */
export interface ToolCallRecord {
  tool: string;
  success: boolean;
  duration_ms: number;
  error?: string;
}

/**
 * Skill invocation record for audit
 */
export interface SkillInvocationRecord {
  invocationId: string;
  skillName: string;
  skillVersion: string;
  orgId: string;
  userId: string;
  inputHash: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  durationMs: number;
  toolCalls: ToolCallRecord[];
  contextSnapshot: {
    profile: string;
    subscriptionTier: string;
    isSuperAdmin: boolean;
  };
  createdAt: Date;
}

/**
 * Skill recommendation for discovery
 */
export interface SkillRecommendation {
  skillName: string;
  displayName: string;
  description: string;
  reason: string;
  priority: number;
}

/**
 * Extended context for skill recommendations
 */
export interface RecommendationContext extends SkillContext {
  currentPage: string;
  recentActions: string[];
  dealInProgress?: string;
}
