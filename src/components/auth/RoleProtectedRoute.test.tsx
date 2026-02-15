import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, Outlet } from 'react-router-dom';
import { useServerRole, useServerRoles } from '@/hooks/useServerRole';
import { useOrganization } from '@/context/OrganizationContext';
import { RoleProtectedRoute } from '@/components/auth/RoleProtectedRoute';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@/hooks/useServerRole', () => ({
  useServerRole: vi.fn(),
  useServerRoles: vi.fn(),
}));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;
const OnboardingPage = () => <div>Onboarding Page</div>;
const DashboardPage = () => <div>Dashboard Page</div>;

describe('RoleProtectedRoute', () => {
  it('redirects to /onboarding if no role is found', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: null, isLoading: false });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/protected" element={<RoleProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });

  it('denies access if org type is not allowed', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: { org_type: 'buyer' }, isLoading: false });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/protected" element={<RoleProtectedRoute allowedOrgTypes={['supplier']} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Access Restricted')).toBeInTheDocument();
  });

  it('denies access if role is not allowed', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: { member_role: 'member' }, isLoading: false });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/protected" element={<RoleProtectedRoute allowedRoles={['owner']} />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Permission Required')).toBeInTheDocument();
  });

  it('denies access if subscription tier is not sufficient', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: { subscription_tier: 'free' }, isLoading: false });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/protected" element={<RoleProtectedRoute requireSubscription="pro" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
  });

  it('renders the child component if user has the correct permissions', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: { org_type: 'supplier', member_role: 'owner', subscription_tier: 'pro' }, isLoading: false });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleProtectedRoute allowedOrgTypes={['supplier']} allowedRoles={['owner']} requireSubscription="pro" />}>
            <Route index element={<TestComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading screen when role is loading', () => {
    (useServerRole as jest.Mock).mockReturnValue({ data: null, isLoading: true });
    (useServerRoles as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    (useOrganization as jest.Mock).mockReturnValue({ currentOrg: { id: '123' } });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<RoleProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Validating access...')).toBeInTheDocument();
  });
});
