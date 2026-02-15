import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { listRecyclingProjects } from '@/services/recycling.service';
import Recycling from '@/pages/Recycling';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/services/recycling.service', () => ({
  listRecyclingProjects: vi.fn(),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('Recycling Page', () => {
  it('displays a list of recycling projects', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        data: [
          { id: '1', name: 'Project 1', start_date: '2024-01-01', status: 'Active' },
          { id: '2', name: 'Project 2', start_date: '2024-02-01', status: 'Completed' },
        ],
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<Recycling />);

    expect(await screen.findByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays an error message if the request fails', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch projects'),
    });

    renderWithProviders(<Recycling />);

    expect(await screen.findByText('Error: Failed to fetch projects')).toBeInTheDocument();
  });

  it('displays a loading message while fetching data', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<Recycling />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
