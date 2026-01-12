/**
 * Authenticated Client Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthenticatedClient, callAuthenticatedRpc } from './authenticated-client';
import { SupabaseClient } from '@supabase/supabase-js';

// Mock createClient from supabase-js
vi.mock('@supabase/supabase-js', async () => {
  const actual = await vi.importActual('@supabase/supabase-js');
  return {
    ...actual,
    createClient: vi.fn().mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
    }),
  };
});

describe('Authenticated Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuthenticatedClient', () => {
    it('should create a client with the provided access token', () => {
      const token = 'test-access-token';
      const client = createAuthenticatedClient(token);
      
      expect(client).toBeDefined();
    });

    it('should return a SupabaseClient instance', () => {
      const token = 'test-access-token';
      const client = createAuthenticatedClient(token);
      
      // The mock returns an object with rpc method
      expect(client.rpc).toBeDefined();
    });
  });

  describe('callAuthenticatedRpc', () => {
    it('should call rpc with function name and args', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({ data: { id: 'test' }, error: null }),
      } as unknown as SupabaseClient;
      
      const result = await callAuthenticatedRpc(
        mockClient,
        'list_rfqs' as any,
        {}
      );
      
      expect(mockClient.rpc).toHaveBeenCalledWith('list_rfqs', {});
      expect(result.data).toEqual({ id: 'test' });
      expect(result.error).toBeNull();
    });

    it('should return error when rpc fails', async () => {
      const mockError = { message: 'RPC error', code: 'ERROR' };
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      } as unknown as SupabaseClient;
      
      const result = await callAuthenticatedRpc(
        mockClient,
        'list_rfqs' as any,
        {}
      );
      
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('RPC error');
    });

    it('should pass arguments to rpc function', async () => {
      const mockClient = {
        rpc: vi.fn().mockResolvedValue({ data: { id: 'new-rfq' }, error: null }),
      } as unknown as SupabaseClient;
      
      const args = {
        p_title: 'Test RFQ',
        p_description: 'Test description',
      };
      
      await callAuthenticatedRpc(mockClient, 'create_rfq' as any, args);
      
      expect(mockClient.rpc).toHaveBeenCalledWith('create_rfq', args);
    });
  });
});
