/**
 * Skill Audit Helper
 * 
 * Logs skill invocations for debugging and compliance.
 * Uses Edge Function for service_role insert permissions.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SkillContext, SkillResult, ToolCallRecord } from './types';

// Re-export ToolCallRecord for convenience
export type { ToolCallRecord } from './types';

/**
 * Log a skill invocation
 * Non-blocking - failures don't affect skill execution
 */
export async function logSkillInvocation(params: {
  skillName: string;
  skillVersion: string;
  context: SkillContext;
  inputHash: string;
  result: SkillResult<unknown>;
  durationMs: number;
  toolCalls: ToolCallRecord[];
}): Promise<void> {
  try {
    // Use Edge Function to insert (service role)
    await supabase.functions.invoke('log-skill-invocation', {
      body: {
        skill_name: params.skillName,
        skill_version: params.skillVersion,
        org_id: params.context.orgId,
        user_id: params.context.userId,
        input_hash: params.inputHash,
        success: params.result.success,
        error_code: params.result.error?.code,
        error_message: params.result.error?.message,
        duration_ms: params.durationMs,
        tool_calls: params.toolCalls,
        context_snapshot: {
          profile: params.context.profile,
          subscription_tier: params.context.subscriptionTier,
          is_super_admin: params.context.isSuperAdmin,
        },
      },
    });
  } catch (error) {
    console.error('[SkillAudit] Failed to log invocation:', error);
    // Non-blocking - don't fail the skill if audit fails
  }
}

/**
 * Hash input for privacy-safe logging
 * Uses base64 of truncated JSON as a simple fingerprint
 */
export function hashInput(input: unknown): string {
  try {
    const str = JSON.stringify(input);
    // Simple hash: base64 of first 100 chars
    // In production, use Web Crypto API for SHA-256
    return btoa(str.slice(0, 100));
  } catch {
    return 'unhashable';
  }
}

/**
 * Log a skill event (for fine-grained tracking)
 */
export async function logSkillEvent(
  eventType: string,
  context: SkillContext,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('domain_events').insert({
      org_id: context.orgId,
      actor_user_id: context.userId,
      entity_type: 'skill',
      event_type: eventType,
      payload: {
        ...payload,
        profile: context.profile,
        subscription_tier: context.subscriptionTier,
      },
    });
  } catch (error) {
    console.error('[SkillAudit] Failed to log event:', error);
  }
}

/**
 * Create a tool call tracker for measuring execution
 */
export function createToolCallTracker(): {
  track: <T>(toolName: string, fn: () => Promise<T>) => Promise<T>;
  getRecords: () => ToolCallRecord[];
} {
  const records: ToolCallRecord[] = [];

  return {
    track: async <T>(toolName: string, fn: () => Promise<T>): Promise<T> => {
      const start = performance.now();
      try {
        const result = await fn();
        records.push({
          tool: toolName,
          success: true,
          duration_ms: Math.round(performance.now() - start),
        });
        return result;
      } catch (error) {
        records.push({
          tool: toolName,
          success: false,
          duration_ms: Math.round(performance.now() - start),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    },
    getRecords: () => [...records],
  };
}
