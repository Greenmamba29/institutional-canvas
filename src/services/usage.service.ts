/**
 * Usage Service - RPC wrappers for usage tracking
 * @see ORCHESTRATION/API.openapiv1.yaml
 */

import { callRpc } from '@/lib/supabase/rpc';

export interface UsageLimitResult {
  current_usage: number;
  daily_limit: number;
  remaining: number;
  can_process: boolean;
}

export interface CanProcessResult {
  can_process: boolean;
  reason: string;
  remaining: number;
  tier?: string;
  daily_limit?: number;
  current_usage?: number;
}

export interface UsageCounter {
  user_id: string;
  date: string;
  files_processed: number;
  tier: string;
  tokens_used: number | null;
  cost_usd: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Check if user can process files based on their tier limits
 */
export async function checkCanProcess(userId: string, requested: number = 1) {
  return callRpc<CanProcessResult>('can_process', { p_user: userId, p_requested: requested });
}

/**
 * Check usage limit for a user
 */
export async function checkUsageLimit(userId: string, tier?: string) {
  return callRpc<UsageLimitResult>('check_usage_limit', { p_user_id: userId, p_tier: tier ?? null });
}

/**
 * Increment usage counters after processing
 */
export async function incrementUsageCounters(
  userId: string,
  filesCount: number = 1,
  tokens: number = 0,
  cost: number = 0
) {
  return callRpc<UsageCounter>('increment_usage_counters', {
    p_user_id: userId,
    p_files_count: filesCount,
    p_tokens: tokens,
    p_cost: cost,
  });
}
