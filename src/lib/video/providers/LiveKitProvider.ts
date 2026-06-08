/**
 * LiveKitProvider — stub. Implements the adapter contract but every capability
 * throws NotImplementedError. Enabling this requires the `livekit-client` (and
 * server-side `livekit-server-sdk` in an edge function) — declared in
 * depsNeeded. This file stays import-free of those packages so the stub never
 * pulls a heavy/missing dependency into the bundle.
 */

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

export class LiveKitProvider implements VideoProviderAdapter {
  readonly name: VideoProviderName = 'livekit';

  async createSession(_input: CreateSessionInput): Promise<VideoSession> {
    throw new NotImplementedError(this.name, 'createSession');
  }

  async createJoinToken(_input: CreateJoinTokenInput): Promise<JoinToken> {
    throw new NotImplementedError(this.name, 'createJoinToken');
  }

  async startRecording(_sessionId: string): Promise<void> {
    throw new NotImplementedError(this.name, 'startRecording');
  }

  async stopRecording(_sessionId: string): Promise<void> {
    throw new NotImplementedError(this.name, 'stopRecording');
  }

  async getTranscript(_sessionId: string): Promise<Transcript> {
    throw new NotImplementedError(this.name, 'getTranscript');
  }

  async subscribeToEvents(_handler: VideoEventHandler): Promise<Unsubscribe> {
    throw new NotImplementedError(this.name, 'subscribeToEvents');
  }
}
