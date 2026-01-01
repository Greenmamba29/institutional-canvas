/**
 * Daily.co Service - TeleBuy Video Call Integration
 *
 * Creates and manages video rooms for buyer-supplier negotiations
 * @see https://docs.daily.co/reference/rest-api
 */

const DAILY_API_KEY = import.meta.env.VITE_DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number; // Unix timestamp when room expires
    max_participants?: number;
    enable_chat?: boolean;
    enable_screenshare?: boolean;
    enable_recording?: boolean;
  };
}

export interface CreateRoomOptions {
  name?: string; // Room name (auto-generated if not provided)
  privacy?: 'public' | 'private';
  maxParticipants?: number;
  expiresInMinutes?: number; // Auto-delete room after X minutes
  enableChat?: boolean;
  enableScreenshare?: boolean;
  enableRecording?: boolean;
}

/**
 * Create a Daily.co video room for TeleBuy negotiation
 */
export async function createVideoRoom(options: CreateRoomOptions = {}): Promise<{ data: DailyRoom | null; error: Error | null }> {
  if (!DAILY_API_KEY) {
    return {
      data: null,
      error: new Error('Daily.co API key not configured. Please set VITE_DAILY_API_KEY in .env'),
    };
  }

  try {
    const roomName = options.name || `telebuy-${Date.now()}`;
    const expiresAt = options.expiresInMinutes
      ? Math.floor(Date.now() / 1000) + options.expiresInMinutes * 60
      : undefined;

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: options.privacy || 'private',
        properties: {
          exp: expiresAt,
          max_participants: options.maxParticipants || 2, // Default: 1 buyer + 1 supplier
          enable_chat: options.enableChat ?? true,
          enable_screenshare: options.enableScreenshare ?? true,
          enable_recording: options.enableRecording ?? false,
          enable_knocking: true, // Require permission to join
          eject_at_room_exp: true, // Auto-eject when room expires
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`);
    }

    const room: DailyRoom = await response.json();

    return { data: room, error: null };
  } catch (error) {
    console.error('Failed to create Daily.co room:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error creating video room'),
    };
  }
}

/**
 * Get room details by name
 */
export async function getRoom(roomName: string): Promise<{ data: DailyRoom | null; error: Error | null }> {
  if (!DAILY_API_KEY) {
    return {
      data: null,
      error: new Error('Daily.co API key not configured'),
    };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: null, error: new Error('Room not found') };
      }
      const error = await response.json();
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`);
    }

    const room: DailyRoom = await response.json();
    return { data: room, error: null };
  } catch (error) {
    console.error('Failed to get Daily.co room:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error fetching room'),
    };
  }
}

/**
 * Delete a video room
 */
export async function deleteRoom(roomName: string): Promise<{ success: boolean; error: Error | null }> {
  if (!DAILY_API_KEY) {
    return {
      success: false,
      error: new Error('Daily.co API key not configured'),
    };
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to delete Daily.co room:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error deleting room'),
    };
  }
}

/**
 * Create a meeting token for authenticated access to a room
 * Tokens can have user-specific permissions and metadata
 */
export async function createMeetingToken(
  roomName: string,
  options: {
    userId?: string;
    userName?: string;
    isOwner?: boolean;
    expiresInMinutes?: number;
  } = {}
): Promise<{ token: string | null; error: Error | null }> {
  if (!DAILY_API_KEY) {
    return {
      token: null,
      error: new Error('Daily.co API key not configured'),
    };
  }

  try {
    const expiresAt = options.expiresInMinutes
      ? Math.floor(Date.now() / 1000) + options.expiresInMinutes * 60
      : undefined;

    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: options.userId,
          user_name: options.userName,
          is_owner: options.isOwner ?? false,
          exp: expiresAt,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`);
    }

    const { token } = await response.json();
    return { token, error: null };
  } catch (error) {
    console.error('Failed to create meeting token:', error);
    return {
      token: null,
      error: error instanceof Error ? error : new Error('Unknown error creating token'),
    };
  }
}

/**
 * Create a TeleBuy video room for a specific deal/RFQ
 * Returns room URL and tokens for buyer and supplier
 */
export async function createTeleBuyRoom(options: {
  dealId: string;
  buyerName: string;
  supplierName: string;
  durationMinutes?: number;
}): Promise<{
  roomUrl: string | null;
  buyerToken: string | null;
  supplierToken: string | null;
  error: Error | null;
}> {
  const { dealId, buyerName, supplierName, durationMinutes = 60 } = options;

  // Create room
  const { data: room, error: roomError } = await createVideoRoom({
    name: `deal-${dealId}`,
    maxParticipants: 2,
    expiresInMinutes: durationMinutes,
    enableChat: true,
    enableScreenshare: true,
    enableRecording: false,
  });

  if (roomError || !room) {
    return {
      roomUrl: null,
      buyerToken: null,
      supplierToken: null,
      error: roomError || new Error('Failed to create room'),
    };
  }

  // Create buyer token
  const { token: buyerToken, error: buyerTokenError } = await createMeetingToken(room.name, {
    userId: `buyer-${dealId}`,
    userName: buyerName,
    isOwner: true,
    expiresInMinutes: durationMinutes,
  });

  if (buyerTokenError) {
    await deleteRoom(room.name); // Cleanup
    return {
      roomUrl: null,
      buyerToken: null,
      supplierToken: null,
      error: buyerTokenError,
    };
  }

  // Create supplier token
  const { token: supplierToken, error: supplierTokenError } = await createMeetingToken(room.name, {
    userId: `supplier-${dealId}`,
    userName: supplierName,
    isOwner: false,
    expiresInMinutes: durationMinutes,
  });

  if (supplierTokenError) {
    await deleteRoom(room.name); // Cleanup
    return {
      roomUrl: null,
      buyerToken: null,
      supplierToken: null,
      error: supplierTokenError,
    };
  }

  return {
    roomUrl: room.url,
    buyerToken,
    supplierToken,
    error: null,
  };
}

/**
 * Check if Daily.co is configured
 */
export function isDailyConfigured(): boolean {
  return Boolean(DAILY_API_KEY);
}
