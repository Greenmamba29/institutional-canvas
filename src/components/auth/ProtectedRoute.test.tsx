import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Mock auth state - configurable per test
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
};

// Mock org state - configurable per test
const mockOrgState = {
  hasOrganization: false,
  isLoading: false,
};

// Mock useAuth hook
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock useOrganization hook
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => mockOrgState,
}));

/**
 * Render helper that wraps ProtectedRoute in a router with test routes
 */
function renderWithRouter(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth" element={<div data-testid="auth-page">Auth Page</div>} />
        <Route path="/onboarding" element={<div data-testid="onboarding-redirect">Onboarding Redirect</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
          <Route path="/onboarding" element={<div data-testid="onboarding-flow">Onboarding Flow</div>} />
          <Route path="/settings" element={<div data-testid="settings">Settings</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset to default unauthenticated state before each test
    mockAuthState.isAuthenticated = false;
    mockAuthState.isLoading = false;
    mockOrgState.hasOrganization = false;
    mockOrgState.isLoading = false;
  });

  describe('Loading States', () => {
    it('shows loading screen while auth is loading', () => {
      mockAuthState.isLoading = true;
      
      renderWithRouter('/dashboard');
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });

    it('shows loading screen while org is loading', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.isLoading = false;
      mockOrgState.isLoading = true;
      
      renderWithRouter('/dashboard');
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Authentication Redirects', () => {
    it('redirects to /auth when not authenticated', () => {
      mockAuthState.isAuthenticated = false;
      mockAuthState.isLoading = false;
      
      renderWithRouter('/dashboard');
      
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });

    it('redirects to /onboarding when authenticated but no organization', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.isLoading = false;
      mockOrgState.hasOrganization = false;
      mockOrgState.isLoading = false;
      
      renderWithRouter('/dashboard');
      
      expect(screen.getByTestId('onboarding-redirect')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Onboarding Path Exception', () => {
    it('allows access to /onboarding without organization', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.isLoading = false;
      mockOrgState.hasOrganization = false;
      mockOrgState.isLoading = false;
      
      renderWithRouter('/onboarding');
      
      // Should render the onboarding flow outlet, not redirect
      expect(screen.getByTestId('onboarding-flow')).toBeInTheDocument();
      expect(screen.queryByTestId('onboarding-redirect')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    it('renders protected content when authenticated with organization', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.isLoading = false;
      mockOrgState.hasOrganization = true;
      mockOrgState.isLoading = false;
      
      renderWithRouter('/dashboard');
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('onboarding-redirect')).not.toBeInTheDocument();
    });

    it('allows navigation to other protected routes when fully authenticated', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.isLoading = false;
      mockOrgState.hasOrganization = true;
      mockOrgState.isLoading = false;
      
      renderWithRouter('/settings');
      
      expect(screen.getByTestId('settings')).toBeInTheDocument();
    });
  });
});
