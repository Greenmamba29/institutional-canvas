/**
 * TeleBuy Service - Video meeting session management
 * 
 * Provides authenticated RPC calls for TeleBuy session operations.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { validateInput } from '@/lib/validation/schemas';
import {
  createTelebuySessionSchema,
  updateSessionStatusSchema,
  addSessionTranscriptSchema,
  type CreateTelebuySessionInput,
  type UpdateSessionStatusInput,
  type AddSessionTranscriptInput,
} from '@/lib/validation/telebuy.schemas';
import type { Tables, Database } from '@/integrations/supabase/types';

export type TelebuySession = Tables<'telebuy_sessions'>;
export type TelebuyDocument = Tables<'telebuy_documents'>;

// ============================================
// WRITE OPERATIONS (Authenticated RPC)
// ============================================

/**
 * Create a new TeleBuy session
 */
export async function createTelebuySession(
  client: SupabaseClient<Database>,
  params: CreateTelebuySessionInput
): Promise<{ data: TelebuySession | null; error: Error | null }> {
  try {
    const validated = validateInput(createTelebuySessionSchema, params);
    return callAuthenticatedRpc<TelebuySession>(client, 'create_telebuy_session', validated);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Validation failed');
    return { data: null, error };
  }
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  client: SupabaseClient<Database>,
  params: UpdateSessionStatusInput
): Promise<{ data: TelebuySession | null; error: Error | null }> {
  try {
    const validated = validateInput(updateSessionStatusSchema, params);
    return callAuthenticatedRpc<TelebuySession>(client, 'update_telebuy_session_status', validated);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Validation failed');
    return { data: null, error };
  }
}

/**
 * Add transcript to session
 */
export async function addSessionTranscript(
  client: SupabaseClient<Database>,
  params: AddSessionTranscriptInput
): Promise<{ data: TelebuySession | null; error: Error | null }> {
  try {
    const validated = validateInput(addSessionTranscriptSchema, params);
    return callAuthenticatedRpc<TelebuySession>(client, 'add_session_transcript', validated);
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Validation failed');
    return { data: null, error };
  }
}

// ============================================
// READ-ONLY QUERIES (Direct reads - RLS protected)
// ============================================

/**
 * Get TeleBuy sessions for current user
 */
export async function getTelebuySessions(options?: { status?: string; limit?: number }) {
  let query = supabase
    .from('telebuy_sessions')
    .select(`
      *,
      suppliers (name, logo_url, verification_tier)
    `)
    .order('scheduled_at', { ascending: false });
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const { data, error } = await query;
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get session by ID with documents
 */
export async function getSessionById(sessionId: string) {
  const { data, error } = await supabase
    .from('telebuy_sessions')
    .select(`
      *,
      suppliers (*),
      telebuy_documents (*)
    `)
    .eq('id', sessionId)
    .single();
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get upcoming sessions
 */
export async function getUpcomingSessions(limit: number = 5) {
  const { data, error } = await supabase
    .from('telebuy_sessions')
    .select(`
      *,
      suppliers (name, logo_url)
    `)
    .gte('scheduled_at', new Date().toISOString())
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get session documents
 */
export async function getSessionDocuments(sessionId: string) {
  const { data, error } = await supabase
    .from('telebuy_documents')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  
  return { data, error: error ? new Error(error.message) : null };
}
