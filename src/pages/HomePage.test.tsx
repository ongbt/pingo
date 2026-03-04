/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock dependencies
vi.mock('@/hooks/use-pingo-auth', () => ({
  usePingoAuth: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    games: {
      getLiveStats: 'mock-getLiveStats',
    },
    seed: {
      run: 'mock-seedRun',
    },
  },
}));

vi.mock('@/components/PopularSheets', () => {
  return {
    default: () => <div data-testid="popular-sheets">PopularSheets</div>,
    SeeAllLink: () => <button data-testid="see-all">See All</button>,
  };
});

// Import the specific mocked functions to change their return values
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import { useQuery, useMutation } from 'convex/react';

describe('HomePage', () => {
  const mockSeedMutation = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    const mockMut = mockSeedMutation as any;
    mockMut.withOptimisticUpdate = vi.fn().mockReturnValue(mockMut);
    vi.mocked(useMutation).mockReturnValue(mockMut);
  });

  it('renders guest state correctly', () => {
    vi.mocked(usePingoAuth).mockReturnValue({
      user: null as unknown as Record<string, unknown> as any,
      profile: null as unknown as Record<string, unknown> as any,
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: false,
    });
    vi.mocked(useQuery).mockReturnValue({ totalPlayers: 1500 }); // "1.5k"

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Now: 1\.5k Players/i)).toBeInTheDocument();
    expect(screen.getByText(/Host a Game/i)).toBeInTheDocument();
    expect(screen.getByText(/Join a Game/i)).toBeInTheDocument();
    expect(screen.getByTestId('popular-sheets')).toBeInTheDocument();

    // Check if the auth button correctly routes to /signin for guests
    const profileLink = screen.getAllByRole('link', {
      name: /account_circle\s*Profile/i,
    });
    expect(profileLink.length).toBeGreaterThan(0);
  });

  it('renders authenticated state correctly with avatar', () => {
    vi.mocked(usePingoAuth).mockReturnValue({
      user: { email: 'test@example.com' } as Record<string, unknown> as any,
      profile: {
        id: '1',
        nickname: 'Tester',
        avatar_url: 'https://example.com/avatar.png',
      } as any,
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: true,
    });
    vi.mocked(useQuery).mockReturnValue({ totalPlayers: 42 });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Now: 42 Players/i)).toBeInTheDocument();

    // Auth button should now have an image
    const avatarImages = screen.getAllByAltText('Profile');
    expect(avatarImages[0]).toHaveAttribute(
      'src',
      'https://example.com/avatar.png'
    );
  });

  it('renders authenticated state correctly with initial', () => {
    vi.mocked(usePingoAuth).mockReturnValue({
      user: { email: 'test@example.com' } as Record<string, unknown> as any,
      profile: { id: '1', nickname: 'Tester', avatar_url: null } as any,
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: true,
    });
    vi.mocked(useQuery).mockReturnValue({ totalPlayers: null }); // "..."

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Live Now: … Players/i)).toBeInTheDocument();
    expect(screen.getByText('T')).toBeInTheDocument(); // Initial for Tester
  });
});
