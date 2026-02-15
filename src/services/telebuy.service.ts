/**
 * TeleBuy Service - RPC wrappers for TeleBuy session operations
 * 
 * Uses create_telebuy_session, update_telebuy_session_status, update_telebuy_notes RPCs
 * Integrates with Daily.co for video calling via Edge Function (secure)
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

// Daily.co domain for URL construction (public config, not a secret)
const DAILY_DOMAIN = 'lithiumbuy.daily.co';

export type TelebuySession = Tables<'telebuy_sessions'>;
export type TelebuyDocument = Tables<'telebuy_documents'>;

export type VideoProvider = 'daily' | 'google_meet';

export interface CreateTelebuySessionParams {
  supplierId: string;
  scheduledAt: string;
  meetingUrl: string;
  notes?: string;
  videoProvider?: VideoProvider;
  googleMeetLink?: string;
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
    p_video_provider: params.videoProvider || 'daily',
    p_google_meet_link: params.googleMeetLink || null,
  });
}

/**
 * Update session status via RPC
 */
export async function updateSessionStatus(sessionId: string, status: string) {
  return callRpc<TelebuySession>('update_telebuy_session_status', {
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
    .select('*')
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
    .select('*')
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

// ============================================
// DAILY.CO VIDEO CALLING INTEGRATION
// All API calls go through secure Edge Function
// ============================================

export interface DailyRoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    enable_recording?: string;
    max_participants?: number;
  };
}

/**
 * Create a Daily.co room for TeleBuy session (via Edge Function)
 * API key is kept server-side for security
 */
export async function createDailyRoom(config?: DailyRoomConfig): Promise<{
  url: string;
  name: string;
  error?: Error;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('daily-rooms', {
      body: {
        action: 'create',
        config,
      },
    });

    if (error) {
      console.error('Failed to create Daily.co room:', error);
      return {
        url: '',
        name: '',
        error: new Error(error.message || 'Failed to create room'),
      };
    }

    return {
      url: data.url,
      name: data.name,
    };
  } catch (error) {
    console.error('Error creating Daily.co room:', error);
    return {
      url: '',
      name: '',
      error: error instanceof Error ? error : new Error('Unknown error creating room'),
    };
  }
}

/**
 * Delete a Daily.co room (via Edge Function)
 */
export async function deleteDailyRoom(roomName: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const { error } = await supabase.functions.invoke('daily-rooms', {
      body: {
        action: 'delete',
        roomName,
      },
    });

    if (error) {
      console.error('Failed to delete Daily.co room:', error);
      return {
        success: false,
        error: new Error(error.message || 'Failed to delete room'),
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting Daily.co room:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error deleting room'),
    };
  }
}

/**
 * Get Daily.co room details (via Edge Function)
 */
export async function getDailyRoomInfo(roomName: string) {
  try {
    const { data, error } = await supabase.functions.invoke('daily-rooms', {
      body: {
        action: 'get',
        roomName,
      },
    });

    if (error) {
      console.error('Failed to get Daily.co room info:', error);
      return {
        data: null,
        error: new Error(error.message || 'Failed to get room info'),
      };
    }

    return { data: data.data, error: null };
  } catch (error) {
    console.error('Error getting Daily.co room info:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error getting room info'),
    };
  }
}
