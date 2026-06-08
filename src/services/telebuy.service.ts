/**
 * TeleBuy Service - RPC wrappers for TeleBuy session operations
 * 
 * Uses create_telebuy_session, update_telebuy_session_status, update_telebuy_notes RPCs
 * Integrates with Daily.co for video calling via Edge Function (secure)
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';
import { getVideoProvider, type VideoProviderName, type VideoSession } from '@/lib/video';

export type TelebuySession = Tables<'telebuy_sessions'>;
export type TelebuyDocument = Tables<'telebuy_documents'>;

// Provider names handled by the create-session UI today. The adapter layer
// supports more (zoom/livekit) but those are stubs, so the UI only offers these.
export type VideoProvider = Extract<VideoProviderName, 'daily' | 'google_meet'>;

export interface CreateTelebuySessionParams {
  supplierId: string;
  scheduledAt: string;
  meetingUrl: string;
  notes?: string;
  videoProvider?: VideoProvider;
  googleMeetLink?: string;
}

/**
 * Create a new TeleBuy session.
 *
 * Workflow seam (Phase 0):
 *   1. Persist the session record via the create_telebuy_session RPC.
 *   2. Provision a video room through the provider adapter (never a hardcoded
 *      provider) and store its room_url as the session's meeting_url.
 *   3. Mirror the session summary/status to Airtable (sync-to-airtable).
 *
 * Payment authorization (Stripe PaymentIntent) is intentionally out of Phase 0
 * scope; the call site is left as a clearly-marked TODO below.
 */
export async function createTelebuySession(params: CreateTelebuySessionParams) {
  const providerName: VideoProvider = params.videoProvider || 'daily';

  // 1. Provision the room first for Daily so we can persist the generated URL.
  //    For google_meet the edge function needs the session row id, so we
  //    provision after the RPC insert (see below).
  let videoSession: VideoSession | null = null;
  let meetingUrl = params.meetingUrl;

  if (providerName === 'daily') {
    videoSession = await getVideoProvider('daily').createSession({
      privacy: 'private',
      enableRecording: true,
    });
    meetingUrl = videoSession.roomUrl;
  }

  // 2. Persist the session record (source of truth).
  const { data: session, error } = await callRpc<TelebuySession>('create_telebuy_session', {
    p_supplier_id: params.supplierId,
    p_scheduled_at: params.scheduledAt,
    p_meeting_url: meetingUrl,
    p_notes: params.notes || null,
    p_video_provider: providerName,
    p_google_meet_link: params.googleMeetLink || null,
  });

  if (error || !session) {
    return { data: session, error };
  }

  // 3. For google_meet, provision the room now that we have the session id, then
  //    store the resulting URL back on the record.
  if (providerName === 'google_meet') {
    try {
      videoSession = await getVideoProvider('google_meet').createSession({
        name: 'TeleBuy Session',
        startTime: params.scheduledAt,
        metadata: { sessionId: session.id },
      });
      meetingUrl = videoSession.roomUrl;
    } catch (provisionError) {
      // Non-fatal: the session exists; surface the error to the caller.
      console.error('Failed to provision Google Meet room:', provisionError);
    }
  }
  // For Daily, the room URL was generated before the insert and already stored
  // as the session's meeting_url (p_meeting_url above) — no extra write needed.

  // 4. Mirror to Airtable (operational dashboard). Best-effort, never blocks.
  await syncTelebuySessionToAirtable(session, { meetingUrl, status: session.status ?? 'scheduled' });

  // TODO(payments, Phase 1+): authorize a Stripe PaymentIntent for the TeleBuy
  // booking fee here, before confirming the session to the user. Out of Phase 0
  // scope — leave the call site so the seam is obvious:
  //   await createTelebuyPaymentIntent({ sessionId: session.id, supplierId: params.supplierId });

  return { data: session, error: null };
}

/**
 * Mirror a TeleBuy session's summary/status to Airtable via the
 * sync-to-airtable edge function. Best-effort: failures are logged, not thrown.
 *
 * Payload matches the function's SyncRequest contract:
 *   { table, record, action }
 */
export async function syncTelebuySessionToAirtable(
  session: TelebuySession,
  overrides?: { meetingUrl?: string; status?: string }
): Promise<void> {
  try {
    await supabase.functions.invoke('sync-to-airtable', {
      body: {
        table: 'telebuy_sessions',
        action: 'create',
        record: {
          id: session.id,
          supplier_id: session.supplier_id,
          scheduled_at: session.scheduled_at,
          status: overrides?.status ?? session.status,
          video_provider: session.video_provider,
          meeting_url: overrides?.meetingUrl ?? session.meeting_url,
          notes: session.notes,
        },
      },
    });
  } catch (e) {
    console.error('Failed to sync TeleBuy session to Airtable:', e);
  }
}

/**
 * Update session status via RPC
 */
export async function updateSessionStatus(sessionId: string, status: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return callRpc<TelebuySession>('update_telebuy_session_status' as any, {
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
 * Create a Daily.co room for a TeleBuy session.
 *
 * Now delegates to the video provider adapter rather than calling the edge
 * function directly, so the provider stays swappable. Kept as a thin
 * compatibility wrapper for existing callers expecting `{ url, name }`.
 */
export async function createDailyRoom(config?: DailyRoomConfig): Promise<{
  url: string;
  name: string;
  error?: Error;
}> {
  try {
    const session = await getVideoProvider('daily').createSession({
      name: config?.name,
      privacy: config?.privacy ?? 'private',
      enableRecording: config?.properties?.enable_recording != null,
      maxParticipants: config?.properties?.max_participants,
    });
    return { url: session.roomUrl, name: session.id };
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
