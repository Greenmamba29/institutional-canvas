/**
 * Video provider adapter factory tests.
 */

import { describe, it, expect } from 'vitest';
import {
  getVideoProvider,
  SUPPORTED_VIDEO_PROVIDERS,
  NotImplementedError,
} from './index';

describe('getVideoProvider', () => {
  it('defaults to the daily provider', () => {
    expect(getVideoProvider().name).toBe('daily');
  });

  it('resolves each supported provider by name', () => {
    for (const name of SUPPORTED_VIDEO_PROVIDERS) {
      expect(getVideoProvider(name).name).toBe(name);
    }
  });

  it('returns a stable singleton per provider', () => {
    expect(getVideoProvider('daily')).toBe(getVideoProvider('daily'));
  });

  it('throws on an unknown provider', () => {
    // @ts-expect-error testing runtime guard with an invalid name
    expect(() => getVideoProvider('webex')).toThrow(/Unknown video provider/);
  });

  it('exposes the full adapter surface on every provider', () => {
    for (const name of SUPPORTED_VIDEO_PROVIDERS) {
      const p = getVideoProvider(name);
      expect(typeof p.createSession).toBe('function');
      expect(typeof p.createJoinToken).toBe('function');
      expect(typeof p.startRecording).toBe('function');
      expect(typeof p.stopRecording).toBe('function');
      expect(typeof p.getTranscript).toBe('function');
      expect(typeof p.subscribeToEvents).toBe('function');
    }
  });
});

describe('stub providers', () => {
  it('zoom throws NotImplementedError', async () => {
    await expect(getVideoProvider('zoom').createSession({})).rejects.toBeInstanceOf(
      NotImplementedError
    );
  });

  it('livekit throws NotImplementedError', async () => {
    await expect(
      getVideoProvider('livekit').createJoinToken({ sessionId: 'x' })
    ).rejects.toBeInstanceOf(NotImplementedError);
  });
});
