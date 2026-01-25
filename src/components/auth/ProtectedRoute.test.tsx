import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;
const AuthPage = () => <div>Auth Page</div>;
const OnboardingPage = () => <div>Onboarding Page</div>;

describe('ProtectedRoute', () => {
  it('redirects to /auth if user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ hasOrganization: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Auth Page')).toBeInTheDocument();
  });

  it('redirects to /onboarding if authenticated but no organization', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ hasOrganization: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });

  it('renders the child component if user is authenticated and has an organization', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ hasOrganization: true, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />}>
            <Route index element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading screen when auth is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: false, isLoading: true });
    (useOrganization as jest.Mock).mockReturnValue({ hasOrganization: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading screen when organization is loading', () => {
    (useAuth as jest.Mock).mockReturnValue({ isAuthenticated: true, isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ hasOrganization: false, isLoading: true });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
