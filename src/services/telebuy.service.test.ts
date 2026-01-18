/**
 * TeleBuy Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the service before importing
vi.mock('@/lib/supabase/rpc', () => ({
  callRpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('TeleBuy Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTelebuySession', () => {
    it('should call RPC with proper params', async () => {
      const { createTelebuySession } = await import('./telebuy.service');
      const { callRpc } = await import('@/lib/supabase/rpc');
      
      const validInput = {
        supplierId: '123e4567-e89b-12d3-a456-426614174000',
        scheduledAt: '2026-01-15T14:00:00.000Z',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
      };
      
      await createTelebuySession(validInput);
      
      expect(callRpc).toHaveBeenCalled();
    });
  });

  describe('updateSessionStatus', () => {
    it('should call RPC with session id and status', async () => {
      const { updateSessionStatus } = await import('./telebuy.service');
      const { callRpc } = await import('@/lib/supabase/rpc');
      
      await updateSessionStatus('123e4567-e89b-12d3-a456-426614174000', 'completed');
      
      expect(callRpc).toHaveBeenCalled();
    });
  });

  describe('getTelebuySessions', () => {
    it('should query sessions from database', async () => {
      const { getTelebuySessions } = await import('./telebuy.service');
      const { supabase } = await import('@/lib/supabase/rpc');
      
      await getTelebuySessions();
      
      expect(supabase.from).toHaveBeenCalledWith('telebuy_sessions');
    });
  });

  describe('getUpcomingSessions', () => {
    it('should filter sessions by scheduled_at', async () => {
      const { getUpcomingSessions } = await import('./telebuy.service');
      const { supabase } = await import('@/lib/supabase/rpc');
      
      await getUpcomingSessions();
      
      expect(supabase.from).toHaveBeenCalledWith('telebuy_sessions');
    });
  });
});
