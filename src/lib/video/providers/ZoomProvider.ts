/**
 * ZoomProvider — stub. Implements the adapter contract but every capability
 * throws NotImplementedError. Wire up a `zoom-meetings` edge function (Zoom
 * Server-to-Server OAuth) before enabling.
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

export class ZoomProvider implements VideoProviderAdapter {
  readonly name: VideoProviderName = 'zoom';

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
