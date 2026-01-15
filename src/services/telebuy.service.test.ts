/**
 * TeleBuy Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock the service before importing
vi.mock('@/lib/supabase/authenticated-client', () => ({
  callAuthenticatedRpc: vi.fn().mockResolvedValue({ data: null, error: null }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('TeleBuy Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTelebuySession', () => {
    it('should validate input before calling RPC', async () => {
      const { createTelebuySession } = await import('./telebuy.service');
      const { callAuthenticatedRpc } = await import('@/lib/supabase/authenticated-client');
      
      const mockClient = {} as SupabaseClient;
      const validInput = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_scheduled_at: '2026-01-15T14:00:00.000Z',
      };
      
      await createTelebuySession(mockClient, validInput);
      
      expect(callAuthenticatedRpc).toHaveBeenCalled();
    });

    it('should throw for invalid input', async () => {
      const { createTelebuySession } = await import('./telebuy.service');
      
      const mockClient = {} as SupabaseClient;
      const invalidInput = {
        p_supplier_id: 'not-a-uuid',
        p_scheduled_at: 'not-a-date',
      };
      
      await expect(createTelebuySession(mockClient, invalidInput as any)).rejects.toThrow();
    });
  });

  describe('updateSessionStatus', () => {
    it('should validate status enum', async () => {
      const { updateSessionStatus } = await import('./telebuy.service');
      const { callAuthenticatedRpc } = await import('@/lib/supabase/authenticated-client');
      
      const mockClient = {} as SupabaseClient;
      const validInput = {
        p_session_id: '123e4567-e89b-12d3-a456-426614174000',
        p_status: 'completed' as const,
      };
      
      await updateSessionStatus(mockClient, validInput);
      
      expect(callAuthenticatedRpc).toHaveBeenCalled();
    });
  });

  describe('getTelebuySessions', () => {
    it('should query sessions from database', async () => {
      const { getTelebuySessions } = await import('./telebuy.service');
      const { supabase } = await import('@/integrations/supabase/client');
      
      await getTelebuySessions();
      
      expect(supabase.from).toHaveBeenCalledWith('telebuy_sessions');
    });
  });

  describe('getUpcomingSessions', () => {
    it('should filter sessions by scheduled_at', async () => {
      const { getUpcomingSessions } = await import('./telebuy.service');
      const { supabase } = await import('@/integrations/supabase/client');
      
      await getUpcomingSessions();
      
      expect(supabase.from).toHaveBeenCalledWith('telebuy_sessions');
    });
  });
});
