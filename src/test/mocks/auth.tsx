/**
 * Auth Context Mock
 * 
 * Provides mock auth context for testing
 */

import React from 'react';
import { vi } from 'vitest';

export const mockAuthContext = {
  isAuthenticated: true,
  isLoading: false,
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
  },
  session: {
    access_token: 'mock-access-token',
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  },
  signIn: vi.fn(),
  signOut: vi.fn(),
  getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
};

export const mockOrgContext = {
  currentOrg: {
    id: 'test-org-id',
    name: 'Test Organization',
    org_type: 'buyer' as const,
  },
  currentOrgId: 'test-org-id',
  organizations: [
    {
      id: 'test-org-id',
      name: 'Test Organization',
      org_type: 'buyer' as const,
    },
  ],
  isLoading: false,
  hasOrganization: true,
  switchOrg: vi.fn(),
  refetch: vi.fn(),
};

// Wrapper for testing with auth context
export function createTestWrapper() {
  const AuthContext = React.createContext(mockAuthContext);
  const OrgContext = React.createContext(mockOrgContext);

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={mockAuthContext}>
        <OrgContext.Provider value={mockOrgContext}>
          {children}
        </OrgContext.Provider>
      </AuthContext.Provider>
    );
  };
}
