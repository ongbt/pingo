import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePingoAuth } from './use-pingo-auth';

// Setup Mocks
const mockUseConvexAuth = vi.fn();
const mockUseQuery = vi.fn();
const mockSignOut = vi.fn();

vi.mock('convex/react', () => ({
  useConvexAuth: () => mockUseConvexAuth(),
  useQuery: () => mockUseQuery(),
}));

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signOut: mockSignOut }),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    auth_queries: {
      currentUser: 'mock-currentUser',
    },
  },
}));

describe('usePingoAuth hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles unauthenticated state', () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });
    mockUseQuery.mockReturnValue(undefined);

    const { result } = renderHook(() => usePingoAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeUndefined();
    expect(result.current.profile).toBeNull();
  });

  it('handles loading state', () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });
    mockUseQuery.mockReturnValue(undefined); // user query hasn't resolved

    const { result } = renderHook(() => usePingoAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('maps profile correctly for authenticated user without name/image', () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      _id: 'user-001',
      // no name, no image
    });

    const { result } = renderHook(() => usePingoAuth());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.profile).toEqual({
      id: 'user-001',
      nickname: 'Anonymous',
      avatar_url: null,
    });
  });

  it('maps profile correctly for authenticated user with Google details', () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({
      _id: 'user-002',
      name: 'John Doe',
      image: 'https://avatar.url/john',
    });

    const { result } = renderHook(() => usePingoAuth());

    expect(result.current.profile).toEqual({
      id: 'user-002',
      nickname: 'John Doe',
      avatar_url: 'https://avatar.url/john',
    });
  });

  it('exposes a signOut function that calls convexSignOut', async () => {
    mockUseConvexAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockUseQuery.mockReturnValue({ _id: '123' });

    const { result } = renderHook(() => usePingoAuth());

    await result.current.signOut();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
