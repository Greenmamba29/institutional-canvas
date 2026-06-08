/**
 * Video Provider Adapter — public entrypoint.
 *
 * Consumers (services, hooks, UI) import ONLY from here. They must never import
 * a concrete provider directly, so the active provider can be swapped without
 * touching call sites.
 *
 *   const provider = getVideoProvider();           // -> Daily (default)
 *   const provider = getVideoProvider('google_meet');
 */

import { DailyProvider } from './providers/DailyProvider';
import { GoogleMeetProvider } from './providers/GoogleMeetProvider';
import { ZoomProvider } from './providers/ZoomProvider';
import { LiveKitProvider } from './providers/LiveKitProvider';
import type { VideoProviderAdapter, VideoProviderName } from './types';

export * from './types';

/** Lazily-constructed singletons, one per provider. */
const registry = new Map<VideoProviderName, VideoProviderAdapter>();

const factories: Record<VideoProviderName, () => VideoProviderAdapter> = {
  daily: () => new DailyProvider(),
  google_meet: () => new GoogleMeetProvider(),
  zoom: () => new ZoomProvider(),
  livekit: () => new LiveKitProvider(),
};

/**
 * Resolve the adapter for a provider. Defaults to 'daily' (primary provider);
 * 'google_meet' is the supported fallback.
 */
export function getVideoProvider(name: VideoProviderName = 'daily'): VideoProviderAdapter {
  const factory = factories[name];
  if (!factory) {
    throw new Error(`Unknown video provider: "${name}"`);
  }
  let instance = registry.get(name);
  if (!instance) {
    instance = factory();
    registry.set(name, instance);
  }
  return instance;
}

export const SUPPORTED_VIDEO_PROVIDERS = Object.keys(factories) as VideoProviderName[];
