/**
 * TeleBuy Service - RPC wrappers for TeleBuy session operations
 * 
 * Uses create_telebuy_session, update_session_status, update_telebuy_notes RPCs
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type TelebuySession = Tables<'telebuy_sessions'>;
export type TelebuyDocument = Tables<'telebuy_documents'>;

export interface CreateTelebuySessionParams {
  supplierId: string;
  scheduledAt: string;
  meetingUrl: string;
  notes?: string;
}

/**
 * Create a new TeleBuy session via RPC
 */
export async function createTelebuySession(params: CreateTelebuySessionParams) {
  return callRpc<TelebuySession>('create_telebuy_session', {
    p_supplier_id: params.supplierId,
    p_scheduled_at: params.scheduledAt,
    p_meeting_url: params.meetingUrl,
    p_notes: params.notes || null,
  });
}

/**
 * Update session status via RPC
 */
export async function updateSessionStatus(sessionId: string, status: string) {
  return callRpc<TelebuySession>('update_session_status', {
    p_session_id: sessionId,
    p_status: status,
  });
}

/**
 * Update session notes via RPC
 */
export async function updateTelebuyNotes(sessionId: string, notes: string) {
  return callRpc<TelebuySession>('update_telebuy_notes', {
    p_session_id: sessionId,
    p_notes: notes,
  });
}

/**
 * Add transcript to session via RPC
 */
export async function addSessionTranscript(
  sessionId: string,
  transcript: string,
  aiSummary?: string
) {
  return callRpc<TelebuySession>('add_session_transcript', {
    p_session_id: sessionId,
    p_transcript: transcript,
    p_ai_summary: aiSummary || null,
  });
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
    .maybeSingle();
  
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
