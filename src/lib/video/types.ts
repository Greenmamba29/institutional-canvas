/**
 * Video Provider Adapter — provider-agnostic contract for TeleBuy video calling.
 *
 * The UI and services NEVER reference a concrete provider (Daily/Meet/Zoom/LiveKit).
 * They depend only on these types + the `getVideoProvider` factory in ./index.
 */

/** Supported provider identifiers. */
export type VideoProviderName = 'daily' | 'google_meet' | 'zoom' | 'livekit';

/** A provisioned video room/session at the provider. */
export interface VideoSession {
  /** Provider-side identifier (e.g. Daily room name). */
  id: string;
  /** Provider that owns this session. */
  provider: VideoProviderName;
  /** Join URL participants open in the browser. */
  roomUrl: string;
  /** Privacy of the room, when the provider exposes it. */
  privacy?: 'public' | 'private';
  /** Optional provider-specific metadata, opaque to callers. */
  metadata?: Record<string, unknown>;
}

/** Input for creating a new provider session. */
export interface CreateSessionInput {
  /** Human-friendly room name; providers may sanitize/uniquify it. */
  name?: string;
  privacy?: 'public' | 'private';
  /** Enable cloud recording at creation time, when supported. */
  enableRecording?: boolean;
  maxParticipants?: number;
  /** Scheduled start (ISO 8601); used by calendar-backed providers (Meet). */
  startTime?: string;
  /** Free-form metadata forwarded to the provider where supported. */
  metadata?: Record<string, unknown>;
}

/** Short-lived token granting a participant access to a session. */
export interface JoinToken {
  /** The token string (may be embedded in the room URL for some providers). */
  token: string;
  /** Fully-qualified URL the participant should open. */
  url: string;
  /** Unix epoch seconds when the token expires, if applicable. */
  expiresAt?: number;
}

/** Input for minting a join token. */
export interface CreateJoinTokenInput {
  sessionId: string;
  /** Whether this participant is the meeting owner/host. */
  isOwner?: boolean;
  /** Display name shown to other participants. */
  userName?: string;
}

/** A single transcript line. */
export interface TranscriptSegment {
  speaker?: string;
  text: string;
  /** Seconds from the start of the recording. */
  startSeconds?: number;
  endSeconds?: number;
}

/** Transcript for a completed/recorded session. */
export interface Transcript {
  sessionId: string;
  /** Concatenated plain-text transcript. */
  text: string;
  segments: TranscriptSegment[];
  language?: string;
}

/** Real-time provider event delivered to subscribers. */
export interface VideoEvent {
  type:
    | 'participant-joined'
    | 'participant-left'
    | 'recording-started'
    | 'recording-stopped'
    | 'session-ended'
    | 'error';
  sessionId?: string;
  payload?: Record<string, unknown>;
}

export type VideoEventHandler = (event: VideoEvent) => void;

/** Unsubscribe callback returned by `subscribeToEvents`. */
export type Unsubscribe = () => void;

/**
 * Uniform interface every concrete provider must implement.
 */
export interface VideoProviderAdapter {
  /** Provider identity (useful for persistence / branching). */
  readonly name: VideoProviderName;

  createSession(input: CreateSessionInput): Promise<VideoSession>;
  createJoinToken(input: CreateJoinTokenInput): Promise<JoinToken>;
  startRecording(sessionId: string): Promise<void>;
  stopRecording(sessionId: string): Promise<void>;
  getTranscript(sessionId: string): Promise<Transcript>;
  /** Subscribe to provider events; resolves with an unsubscribe handle. */
  subscribeToEvents(handler: VideoEventHandler): Promise<Unsubscribe>;
}

/** Thrown by stub providers for unimplemented capabilities. */
export class NotImplementedError extends Error {
  constructor(provider: VideoProviderName, capability: string) {
    super(
      `[video:${provider}] "${capability}" is not implemented. ` +
        `This provider is a stub — use 'daily' (primary) or 'google_meet' (fallback).`
    );
    this.name = 'NotImplementedError';
  }
}
