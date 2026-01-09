/**
 * Authenticated Supabase Client Factory
 * 
 * Creates a Supabase client with Auth0 JWT token injected for RLS enforcement.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Use environment variables - support both new and legacy names
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validate environment variables are present
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

/**
 * Creates an authenticated Supabase client with the Auth0 access token
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
