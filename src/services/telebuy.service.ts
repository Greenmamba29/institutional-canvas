/**
 * TeleBuy Service - Video meeting session management
 * 
 * NOTE: Session writes require backend RPC implementation.
 * @see ORCHESTRATION/API.openapiv1.yaml - create_telebuy_session
 */

import { supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type TelebuySession = Tables<'telebuy_sessions'>;
export type TelebuyDocument = Tables<'telebuy_documents'>;

// ============================================
// PENDING RPC IMPLEMENTATIONS
// These functions are stubs - backend must implement the RPCs
// ============================================

/**
 * Create a new TeleBuy session (PENDING BACKEND IMPLEMENTATION)
 * @see ORCHESTRATION/API.openapiv1.yaml - POST /rpc/create_telebuy_session
 */
export async function createTelebuySession(_params: {
  supplierId: string;
  scheduledAt: string;
  meetingUrl: string;
}): Promise<{ data: null; error: Error }> {
  // TODO: Replace with rpc('create_telebuy_session', params) when backend implements
  console.warn('[telebuy.service] create_telebuy_session RPC not yet implemented');
  return { data: null, error: new Error('RPC create_telebuy_session not implemented - request backend implementation') };
}

/**
 * Update session status (PENDING BACKEND IMPLEMENTATION)
 */
export async function updateSessionStatus(_sessionId: string, _status: string): Promise<{ data: null; error: Error }> {
  console.warn('[telebuy.service] update_session_status RPC not yet implemented');
  return { data: null, error: new Error('RPC update_session_status not implemented - request backend implementation') };
}

/**
 * Add transcript to session (PENDING BACKEND IMPLEMENTATION)
 */
export async function addSessionTranscript(_sessionId: string, _transcript: string): Promise<{ data: null; error: Error }> {
  console.warn('[telebuy.service] add_session_transcript RPC not yet implemented');
  return { data: null, error: new Error('RPC add_session_transcript not implemented - request backend implementation') };
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
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
  return { data, error };
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
  
  return { data, error };
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
  
  return { data, error };
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
  
  return { data, error };
}
