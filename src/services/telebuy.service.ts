/**
 * TeleBuy Service - RPC wrappers for TeleBuy session operations
 * 
 * Uses create_telebuy_session, update_session_status, update_telebuy_notes RPCs
 * Integrates with Daily.co for video calling
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

// Daily.co configuration
const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_DOMAIN = import.meta.env.VITE_DAILY_DOMAIN || 'lithiumbuy.daily.co';

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

// ============================================
// DAILY.CO VIDEO CALLING INTEGRATION
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
 * Create a Daily.co room for TeleBuy session
 */
export async function createDailyRoom(config?: DailyRoomConfig): Promise<{
  url: string;
  name: string;
  error?: Error;
}> {
  if (!DAILY_API_KEY) {
    console.error('Daily.co API key not configured');
    return {
      url: '',
      name: '',
      error: new Error('Daily.co API key not configured. Add VITE_DAILY_API_KEY to .env'),
    };
  }

  try {
    const roomName = config?.name || `lithiumbuy-${Date.now()}`;
    
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: config?.privacy || 'private',
        properties: {
          start_video_off: false,
          start_audio_off: false,
          max_participants: 10,
          ...config?.properties,
          // Note: enable_recording requires paid Daily.co plan
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create Daily.co room:', errorData);
      throw new Error(`Daily.co API error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
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
 * Delete a Daily.co room
 */
export async function deleteDailyRoom(roomName: string): Promise<{ success: boolean; error?: Error }> {
  if (!DAILY_API_KEY) {
    return { success: false, error: new Error('Daily.co API key not configured') };
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete room: ${response.statusText}`);
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
 * Get Daily.co room details
 */
export async function getDailyRoomInfo(roomName: string) {
  if (!DAILY_API_KEY) {
    return { data: null, error: new Error('Daily.co API key not configured') };
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get room info: ${response.statusText}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Error getting Daily.co room info:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error getting room info'),
    };
  }
}
