/**
 * useAuthenticatedClient Hook
 * 
 * Provides an authenticated Supabase client with the current user's JWT token.
 * This ensures all RPC calls pass the JWT for RLS policy enforcement.
 * 
 * CRITICAL: All RPC calls that require org context MUST use this client.
 */

import { useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client';
import { Database } from '@/integrations/supabase/types';

interface UseAuthenticatedClientReturn {
  /**
   * Get an authenticated Supabase client
   * Call this before making RPC requests
   */
  getClient: () => Promise<SupabaseClient<Database>>;
  
  /**
   * Execute an authenticated RPC call
   * Handles token acquisition and client creation automatically
   */
  authenticatedRpc: <T>(
    functionName: keyof Database['public']['Functions'],
    args?: Record<string, unknown>
  ) => Promise<{ data: T | null; error: Error | null }>;
}

export function useAuthenticatedClient(): UseAuthenticatedClientReturn {
  const { getAccessToken, isAuthenticated } = useAuth();

  const getClient = useCallback(async (): Promise<SupabaseClient<Database>> => {
    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }
    const token = await getAccessToken();
    return createAuthenticatedClient(token);
  }, [getAccessToken, isAuthenticated]);

  const authenticatedRpc = useCallback(async <T>(
    functionName: keyof Database['public']['Functions'],
    args?: Record<string, unknown>
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const client = await getClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await client.rpc(functionName, args as any);
      
      if (error) {
        console.error(`[RPC Error] ${String(functionName)}:`, error);
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as T, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error(`[RPC Error] ${String(functionName)}:`, error);
      return { data: null, error };
    }
  }, [getClient]);

  return useMemo(() => ({
    getClient,
    authenticatedRpc,
  }), [getClient, authenticatedRpc]);
}

export default useAuthenticatedClient;
