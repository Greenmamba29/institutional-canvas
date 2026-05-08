/**
 * Feature Flags — database-backed, 1-minute TTL cache.
 *
 * Flags control which platform features are live vs. deferred.
 * Tier enforcement lives in useSubscription / RoleProtectedRoute / SubscriptionGate.
 * Feature flags here control whether the feature is available to *any* paid subscriber.
 */

import { supabase } from '@/integrations/supabase/client';

const flagCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_TTL_MS = 60_000;

export async function checkFeatureFlag(flagKey: string, orgId?: string): Promise<boolean> {
  const cacheKey = `${flagKey}:${orgId || 'global'}`;
  const cached = flagCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
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

export async function checkFeatureFlags(flagKeys: string[]): Promise<Record<string, boolean>> {
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

    flagKeys.forEach(key => { results[key] = false; });
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

export function invalidateFeatureFlagCache(flagKey?: string): void {
  if (flagKey) {
    for (const key of flagCache.keys()) {
      if (key.startsWith(`${flagKey}:`)) flagCache.delete(key);
    }
  } else {
    flagCache.clear();
  }
}

/**
 * All known feature flag keys.
 *
 * Platform flags (system-level): control whether a feature is live at all.
 * Tier enforcement is separate — see useSubscription.ts.
 *
 * Default state for new flags should be false (disabled) until explicitly enabled in DB.
 */
export const FEATURE_FLAGS = {
  // ── System ──────────────────────────────────────────────────────────────
  SYSTEM_READ_ONLY: 'system_read_only',
  DEMO_MODE_ENABLED: 'demo_mode_enabled',

  // ── Pro tier features (Phase 1 launch) ─────────────────────────────────
  GRANT_TRACKER: 'grant_tracker',               // Grant opportunity list + detail pages
  ELIGIBILITY_ENGINE: 'eligibility_engine',     // Org eligibility scoring for grants
  READINESS_DASHBOARD: 'readiness_dashboard',   // Grant readiness progress/metrics
  EVIDENCE_VAULT: 'evidence_vault',             // Document management for grant applications

  // ── Enterprise tier features (Phase 1 launch) ──────────────────────────
  TELEBUY_ENABLED: 'telebuy_enabled',           // TeleBuy video negotiations
  AUCTIONS_ENABLED: 'auctions_enabled',         // Auction listing and bidding
  AI_STUDIO_ENABLED: 'ai_studio_enabled',       // AI Studio (SPOT.ai)
  MESSAGES_ENABLED: 'messages_enabled',         // In-app messaging
  RECYCLING_ENABLED: 'recycling_enabled',       // Black mass / recycling module

  // ── Enterprise tier features (Phase 2 — deferred) ──────────────────────
  PARTNER_MATCHING: 'partner_matching',         // Consortium partner matching engine
  FUNDING_PIPELINE: 'funding_pipeline',         // Auto RFQ/PO creation on grant award

  // ── Future / not yet assigned ───────────────────────────────────────────
  API_ACCESS: 'api_access',                     // External API + webhook access

  // ── Phase 2 — Recycling & Compliance OS ────────────────────────────────
  BATTERY_COLLECTION: 'battery_collection',     // Battery collection sites and workers
  CHAIN_OF_CUSTODY: 'chain_of_custody',         // Chain of custody tracking
  COMPLIANCE_AUDIT: 'compliance_audit',         // Compliance audit logs
  RECYCLING_REGISTRY: 'recycling_registry',     // Battery inventory registry
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
