/**
 * GoogleMeetProvider — fallback adapter backed by the `google-meet` edge
 * function, which creates a Google Calendar event with a Meet link (or a
 * deterministic placeholder link when Google OAuth is not configured).
 */

import { supabase } from '@/lib/supabase/rpc';
import type {
  CreateJoinTokenInput,
  CreateSessionInput,
  JoinToken,
  Transcript,
  Unsubscribe,
  VideoEventHandler,
  VideoProviderAdapter,
  VideoProviderName,
  VideoSession,
} from '../types';
import { NotImplementedError } from '../types';

interface MeetResponse {
  success: boolean;
  meetLink?: string;
  calendarEventId?: string;
  error?: string;
}

export class GoogleMeetProvider implements VideoProviderAdapter {
  readonly name: VideoProviderName = 'google_meet';

  /**
   * The google-meet function requires a sessionId (it updates the telebuy row),
   * so the Supabase session record must already exist. Callers pass it through
   * `metadata.sessionId`.
   */
  async createSession(input: CreateSessionInput): Promise<VideoSession> {
    const sessionId = input.metadata?.sessionId as string | undefined;
    if (!sessionId) {
      throw new Error(
        'GoogleMeetProvider.createSession requires metadata.sessionId (the telebuy session row id)'
      );
    }

    const { data, error } = await supabase.functions.invoke<MeetResponse>('google-meet', {
      body: {
        sessionId,
        title: input.name ?? 'TeleBuy Session',
        startTime: input.startTime ?? new Date().toISOString(),
        durationMinutes: 60,
      },
    });

    if (error) throw new Error(error.message || 'google-meet edge function failed');
    if (!data?.success || !data.meetLink) {
      throw new Error(data?.error || 'Failed to generate Google Meet link');
    }

    return {
      id: data.calendarEventId ?? sessionId,
      provider: this.name,
      roomUrl: data.meetLink,
      privacy: 'private',
      metadata: { sessionId, calendarEventId: data.calendarEventId },
    };
  }

  /** Meet links are open-join URLs; the room URL is the token. */
  async createJoinToken(input: CreateJoinTokenInput): Promise<JoinToken> {
    const { data, error } = await supabase
      .from('telebuy_sessions')
      .select('google_meet_link')
      .eq('id', input.sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const url = data?.google_meet_link as string | undefined;
    if (!url) {
      throw new Error(`No Google Meet link found for session "${input.sessionId}"`);
    }
    return { token: url, url };
  }

  async startRecording(): Promise<void> {
    throw new NotImplementedError(this.name, 'startRecording');
  }

  async stopRecording(): Promise<void> {
    throw new NotImplementedError(this.name, 'stopRecording');
  }

  async getTranscript(sessionId: string): Promise<Transcript> {
    const { data, error } = await supabase
      .from('telebuy_sessions')
      .select('transcript')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const text = (data?.transcript as string) ?? '';
    return { sessionId, text, segments: text ? [{ text }] : [] };
  }

  /** Google Meet exposes no client-side realtime event stream here. */
  async subscribeToEvents(_handler: VideoEventHandler): Promise<Unsubscribe> {
    return () => {
      /* no-op: Meet has no in-app event stream */
    };
  }
}
