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
 * Create a new TeleBuy session
 */
export async function createTelebuySession(params: {
  supplierId: string;
  scheduledAt: string;
  meetingUrl: string;
  notes?: string;
}) {
  const { data, error } = await supabase.rpc('create_telebuy_session', {
    p_supplier_id: params.supplierId,
    p_scheduled_at: params.scheduledAt,
    p_meeting_url: params.meetingUrl,
    p_notes: params.notes,
  });
  return { data, error };
}

/**
 * Update session status
 */
export async function updateSessionStatus(sessionId: string, status: string) {
  const { data, error } = await supabase.rpc('update_session_status', {
    p_session_id: sessionId,
    p_status: status,
  });
  return { data, error };
}

/**
 * Add transcript to session
 */
export async function addSessionTranscript(sessionId: string, transcript: string, aiSummary?: string) {
  const { data, error } = await supabase.rpc('add_session_transcript', {
    p_session_id: sessionId,
    p_transcript: transcript,
    p_ai_summary: aiSummary,
  });
  return { data, error };
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
