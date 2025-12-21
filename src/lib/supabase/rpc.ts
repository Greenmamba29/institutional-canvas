/**
 * RPC-Only Write Layer
 * 
 * CRITICAL: All database writes MUST go through this layer.
 * Direct .insert(), .update(), .delete(), .upsert() are FORBIDDEN.
 * 
 * @see ORCHESTRATION/SOT_CONTRACT.md for the full contract
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FunctionNames = keyof Database['public']['Functions'];

/**
 * Type-safe RPC caller - wraps supabase.rpc with error handling
 * All mutations MUST use this or the service layer wrappers.
 */
export async function callRpc<T = unknown>(
  functionName: FunctionNames,
  args?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.rpc(functionName, args as any);
  
  if (error) {
    console.error(`[RPC Error] ${functionName}:`, error);
    return { data: null, error: new Error(error.message) };
  }
  
  return { data: data as T, error: null };
}

// Re-export supabase for reads only
export { supabase };
