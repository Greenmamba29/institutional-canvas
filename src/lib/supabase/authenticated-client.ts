/**
 * Authenticated Supabase Client Factory
 * 
 * Creates a Supabase client with Supabase Auth JWT token injected for RLS enforcement.
 * This ensures Row-Level Security policies can access jwt_user_id() and jwt_org_id().
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Hardcoded values - VITE_* env vars are not supported in Lovable
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTczNTcsImV4cCI6MjA2Nzk5MzM1N30.9NqjmpF9qqaTALfP2VAAii13vjZTI9IKOf_CSRT9lbo';

/**
 * Creates an authenticated Supabase client with the Supabase Auth access token
 */
export function createAuthenticatedClient(accessToken: string): SupabaseClient<Database> {
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Type-safe RPC caller for authenticated requests
 */
export async function callAuthenticatedRpc<T = unknown>(
  client: SupabaseClient<Database>,
  functionName: keyof Database['public']['Functions'],
  args?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await client.rpc(functionName, args as any);
  
  if (error) {
    console.error(`[RPC Error] ${functionName}:`, error);
    return { data: null, error: new Error(error.message) };
  }
  
  return { data: data as T, error: null };
}
