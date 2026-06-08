/**
 * DailyProvider — real adapter backed by the `daily-rooms` edge function
 * (server-side Daily.co API key) and the @daily-co/daily-js client SDK for
 * in-browser realtime events.
 */

import { supabase } from '@/lib/supabase/rpc';
import type {
  CreateJoinTokenInput,
  CreateSessionInput,
  JoinToken,
  Transcript,
  Unsubscribe,
  VideoEvent,
  VideoEventHandler,
  VideoProviderAdapter,
  VideoProviderName,
  VideoSession,
} from '../types';
import { NotImplementedError } from '../types';

interface DailyRoomResponse {
  url: string;
  name: string;
}

/** Map a Daily call-object event name to our normalized VideoEvent type. */
const EVENT_MAP: Record<string, VideoEvent['type']> = {
  'participant-joined': 'participant-joined',
  'participant-left': 'participant-left',
  'recording-started': 'recording-started',
  'recording-stopped': 'recording-stopped',
  'left-meeting': 'session-ended',
  error: 'error',
};

export class DailyProvider implements VideoProviderAdapter {
  readonly name: VideoProviderName = 'daily';

  /** Invoke the daily-rooms edge function with the user's auth context. */
  private async invoke<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke('daily-rooms', { body });
    if (error) {
      throw new Error(error.message || 'daily-rooms edge function failed');
    }
    if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
      throw new Error((data as { error: string }).error);
    }
    return data as T;
  }

  async createSession(input: CreateSessionInput): Promise<VideoSession> {
    const privacy = input.privacy ?? 'private';
    const data = await this.invoke<DailyRoomResponse>({
      action: 'create',
      config: {
        name: input.name,
        privacy,
        properties: {
          start_video_off: false,
          start_audio_off: false,
          max_participants: input.maxParticipants ?? 10,
          ...(input.enableRecording ? { enable_recording: 'cloud' } : {}),
        },
      },
    });

    return {
      id: data.name,
      provider: this.name,
      roomUrl: data.url,
      privacy,
      metadata: input.metadata,
    };
  }

  /**
   * Daily rooms created via this edge function are link-based; the room URL is
   * the join token. (Owner meeting-tokens would require a server-side endpoint
   * that signs them — out of Phase 0 scope.)
   */
  async createJoinToken(input: CreateJoinTokenInput): Promise<JoinToken> {
    const data = await this.invoke<{ data: { url?: string } }>({
      action: 'get',
      roomName: input.sessionId,
    });
    const url = data?.data?.url;
    if (!url) {
      throw new Error(`Daily room "${input.sessionId}" not found`);
    }
    return { token: url, url };
  }

  /**
   * Recording is started/stopped from the client call-object once joined.
   * The edge function does not proxy recording control, so these are no-ops at
   * the adapter level and recording is enabled at room-creation time instead.
   */
  async startRecording(_sessionId: string): Promise<void> {
    // Intentionally a no-op: recording is controlled by the in-call SDK
    // (callObject.startRecording()) which lives in the VideoCallRoom component.
  }

  async stopRecording(_sessionId: string): Promise<void> {
    // See startRecording — controlled client-side via the call object.
  }

  /**
   * Transcripts are produced by the `ai-summarize-transcript` pipeline and
   * persisted on telebuy_sessions; Daily itself is not queried here.
   */
  async getTranscript(sessionId: string): Promise<Transcript> {
    const { data, error } = await supabase
      .from('telebuy_sessions')
      .select('transcript')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const text = (data?.transcript as string) ?? '';
    return {
      sessionId,
      text,
      segments: text ? [{ text }] : [],
    };
  }

  /**
   * Subscribe to realtime Daily events via a @daily-co/daily-js call object.
   * Lazily imported so the SDK is only loaded when actually subscribing.
   */
  async subscribeToEvents(handler: VideoEventHandler): Promise<Unsubscribe> {
    // Loose-typed to stay resilient to @daily-co/daily-js version differences.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Daily = (await import('@daily-co/daily-js')).default as any;
    const call = Daily.getCallInstance?.() ?? Daily.createCallObject();

    const listeners: Array<[string, (e: unknown) => void]> = [];
    for (const [dailyEvent, mapped] of Object.entries(EVENT_MAP)) {
      const cb = (e: unknown) => handler({ type: mapped, payload: e as Record<string, unknown> });
      call.on(dailyEvent, cb);
      listeners.push([dailyEvent, cb]);
    }

    return () => {
      for (const [dailyEvent, cb] of listeners) {
        call.off(dailyEvent, cb);
      }
    };
  }
}

export { NotImplementedError };
