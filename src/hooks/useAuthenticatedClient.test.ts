/**
 * useAuthenticatedClient Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the auth context
const mockGetAccessToken = vi.fn().mockResolvedValue('mock-access-token');

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    session: { access_token: 'mock-access-token' },
    getAccessToken: mockGetAccessToken,
  }),
}));

vi.mock('@/lib/supabase/authenticated-client', () => ({
  createAuthenticatedClient: vi.fn().mockReturnValue({
    rpc: vi.fn(),
    from: vi.fn(),
  }),
}));

describe('useAuthenticatedClient Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide getClient function', async () => {
    const { useAuthenticatedClient } = await import('./useAuthenticatedClient');
    const { result } = renderHook(() => useAuthenticatedClient());
    
    expect(result.current.getClient).toBeDefined();
    expect(typeof result.current.getClient).toBe('function');
  });

  it('should provide executeRpc function', async () => {
    const { useAuthenticatedClient } = await import('./useAuthenticatedClient');
    const { result } = renderHook(() => useAuthenticatedClient());
    
    expect(result.current.executeRpc).toBeDefined();
    expect(typeof result.current.executeRpc).toBe('function');
  });

  it('getClient should return authenticated client', async () => {
    const { useAuthenticatedClient } = await import('./useAuthenticatedClient');
    const { createAuthenticatedClient } = await import('@/lib/supabase/authenticated-client');
    
    const { result } = renderHook(() => useAuthenticatedClient());
    
    await waitFor(async () => {
      const client = await result.current.getClient();
      expect(createAuthenticatedClient).toHaveBeenCalledWith('mock-access-token');
    });
  });
});
