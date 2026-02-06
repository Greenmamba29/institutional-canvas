/**
 * Feature Flags
 * 
 * Check feature flags for gating functionality.
 * Uses the new feature_flags table.
 */

import { supabase } from '@/integrations/supabase/client';

// Cache for feature flags
const flagCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Check if a feature flag is enabled
 */
export async function checkFeatureFlag(
  flagKey: string,
  orgId?: string
): Promise<boolean> {
  const cacheKey = `${flagKey}:${orgId || 'global'}`;
  const cached = flagCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    // First check global feature_flags table
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', flagKey)
      .maybeSingle();

    if (error) {
      console.warn(`[FeatureFlags] Check failed for ${flagKey}:`, error.message);
      return false;
    }

    const result = data?.enabled ?? false;
    flagCache.set(cacheKey, { value: result, timestamp: Date.now() });
    return result;
  } catch (e) {
    console.error('[FeatureFlags] Check error:', e);
    return false;
  }
}

/**
 * Check multiple feature flags at once
 */
export async function checkFeatureFlags(
  flagKeys: string[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled')
      .in('key', flagKeys);

    if (error) {
      console.warn('[FeatureFlags] Bulk check failed:', error.message);
      flagKeys.forEach(key => { results[key] = false; });
      return results;
    }

    // Initialize all to false
    flagKeys.forEach(key => { results[key] = false; });

    // Set values from database
    data?.forEach(row => {
      results[row.key] = row.enabled;
      flagCache.set(`${row.key}:global`, { value: row.enabled, timestamp: Date.now() });
    });

    return results;
  } catch (e) {
    console.error('[FeatureFlags] Bulk check error:', e);
    flagKeys.forEach(key => { results[key] = false; });
    return results;
  }
}

/**
 * Invalidate feature flag cache
 */
export function invalidateFeatureFlagCache(flagKey?: string): void {
  if (flagKey) {
    // Invalidate specific flag
    for (const key of flagCache.keys()) {
      if (key.startsWith(`${flagKey}:`)) {
        flagCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    flagCache.clear();
  }
}

/**
 * Known feature flags
 */
export const FEATURE_FLAGS = {
  SYSTEM_READ_ONLY: 'system_read_only',
  DEMO_MODE_ENABLED: 'demo_mode_enabled',
  TELEBUY_ENABLED: 'telebuy_enabled',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
