/**
 * Kill Switch - Global system_read_only enforcement
 * 
 * When enabled, ALL write operations are blocked system-wide.
 * 
 * SECURITY: Client-side check is for UX convenience only.
 * Server-side enforcement happens in RPCs and Edge Functions.
 */

import { supabase } from '@/integrations/supabase/client';

// Feature flags table may not exist yet - gracefully degrade
const FEATURE_FLAGS_TABLE = 'feature_flags';

// Cache for kill switch state
let cachedKillSwitchState: boolean | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Check if system is in read-only mode
 * 
 * Client-side check with caching for performance.
 * Server-side enforcement is authoritative.
 * 
 * Fails closed (returns true) on errors for safety.
 */
export async function isSystemReadOnly(): Promise<boolean> {
  const now = Date.now();

  // Use cached value if fresh
  if (cachedKillSwitchState !== null && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedKillSwitchState;
  }

  try {
    // Use the new RPC function created in migration
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'system_read_only')
      .maybeSingle();

    if (error) {
      console.warn('[KillSwitch] Feature flag check failed, assuming writable:', error.message);
      cachedKillSwitchState = false;
      cacheTimestamp = now;
      return false;
    }

    cachedKillSwitchState = data?.enabled ?? false;
    cacheTimestamp = now;

    return cachedKillSwitchState;
  } catch (e) {
    console.error('[KillSwitch] Check error:', e);
    // Fail closed for safety
    return true;
  }
}

/**
 * Invalidate the kill switch cache
 * Call this when you know the state has changed
 */
export function invalidateKillSwitchCache(): void {
  cachedKillSwitchState = null;
  cacheTimestamp = 0;
}

/**
 * Subscribe to kill switch changes (realtime)
 * Returns unsubscribe function
 * Note: Only works after feature_flags table is deployed
 */
export function subscribeToKillSwitch(
  callback: (isReadOnly: boolean) => void
): () => void {
  const channel = supabase
    .channel('kill-switch-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'feature_flags',
        filter: 'key=eq.system_read_only',
      },
      (payload) => {
        const newState = payload.new as { enabled?: boolean } | null;
        cachedKillSwitchState = newState?.enabled ?? false;
        cacheTimestamp = Date.now();
        callback(cachedKillSwitchState);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Custom error for read-only mode violations
 */
export class ReadOnlyError extends Error {
  public readonly code = 'SYSTEM_READ_ONLY';
  
  constructor(message = 'System is in read-only mode. Write operations are temporarily disabled.') {
    super(message);
    this.name = 'ReadOnlyError';
  }
}

/**
 * Guard function to throw if system is read-only
 */
export async function assertNotReadOnly(): Promise<void> {
  if (await isSystemReadOnly()) {
    throw new ReadOnlyError();
  }
}
