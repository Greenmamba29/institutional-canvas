/**
 * Capability Policy
 * 
 * Evaluates capability-based access control using server-validated data.
 * All capability checks are performed against backend RPC results.
 */

import { supabase } from '@/integrations/supabase/client';
import type { OnboardingProfile, SubscriptionTier } from './types';

// Cache for capability checks
const capabilityCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Check if user has a specific capability
 * Uses server-side RPC for authoritative check
 */
export async function hasCapability(
  capability: string,
  orgId?: string
): Promise<boolean> {
  const cacheKey = `${capability}:${orgId || 'default'}`;
  const cached = capabilityCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const { data, error } = await supabase.rpc('has_capability', {
      p_capability: capability,
      p_org_id: orgId || null,
    });

    if (error) {
      console.error('[CapabilityPolicy] RPC error:', error);
      return false;
    }

    const result = Boolean(data);
    capabilityCache.set(cacheKey, { value: result, timestamp: Date.now() });
    return result;
  } catch (e) {
    console.error('[CapabilityPolicy] Check error:', e);
    return false;
  }
}

/**
 * Check multiple capabilities at once
 */
export async function hasAllCapabilities(
  capabilities: string[],
  orgId?: string
): Promise<boolean> {
  const results = await Promise.all(
    capabilities.map(cap => hasCapability(cap, orgId))
  );
  return results.every(Boolean);
}

/**
 * Check if user has any of the specified capabilities
 */
export async function hasAnyCapability(
  capabilities: string[],
  orgId?: string
): Promise<boolean> {
  const results = await Promise.all(
    capabilities.map(cap => hasCapability(cap, orgId))
  );
  return results.some(Boolean);
}

/**
 * Get user's onboarding profile from server
 */
export async function getUserProfile(): Promise<OnboardingProfile | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_profile');
    
    if (error) {
      console.error('[CapabilityPolicy] Get profile error:', error);
      return null;
    }

    return data as OnboardingProfile;
  } catch (e) {
    console.error('[CapabilityPolicy] Profile check error:', e);
    return null;
  }
}

/**
 * Check if current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    
    if (error) {
      console.error('[CapabilityPolicy] Super admin check error:', error);
      return false;
    }

    return Boolean(data);
  } catch (e) {
    console.error('[CapabilityPolicy] Super admin error:', e);
    return false;
  }
}

/**
 * Get subscription tier for an organization
 * Note: Falls back to 'free' if column doesn't exist yet
 */
export async function getSubscriptionTier(orgId: string): Promise<SubscriptionTier> {
  try {
    // Use RPC to get org role which includes subscription info
    const { data, error } = await supabase.rpc('get_user_org_role', {
      p_org_id: orgId,
    });

    if (error) {
      console.warn('[CapabilityPolicy] Subscription check error:', error.message);
      return 'free';
    }

    // Map subscription status from RPC result
    const roleData = data as { subscription_tier?: string } | null;
    const tier = roleData?.subscription_tier;
    if (tier === 'pro' || tier === 'enterprise') {
      return tier as SubscriptionTier;
    }
    return 'free';
  } catch (e) {
    console.error('[CapabilityPolicy] Subscription error:', e);
    return 'free';
  }
}

/**
 * Invalidate capability cache for a user/org
 */
export function invalidateCapabilityCache(orgId?: string): void {
  if (orgId) {
    // Invalidate specific org entries
    for (const key of capabilityCache.keys()) {
      if (key.endsWith(`:${orgId}`)) {
        capabilityCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    capabilityCache.clear();
  }
}

/**
 * Profiles that can use marketplace features
 */
export const MARKETPLACE_PROFILES: OnboardingProfile[] = ['buyer', 'supplier', 'soe'];

/**
 * Profiles that can use TeleBuy
 */
export const TELEBUY_PROFILES: OnboardingProfile[] = ['buyer', 'supplier', 'soe'];

/**
 * Check if a profile can access TeleBuy
 */
export function canProfileUseTelebuy(profile: OnboardingProfile): boolean {
  return TELEBUY_PROFILES.includes(profile);
}

/**
 * Check if a profile can participate in marketplace
 */
export function canProfileUseMarketplace(profile: OnboardingProfile): boolean {
  return MARKETPLACE_PROFILES.includes(profile);
}
