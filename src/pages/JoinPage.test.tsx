import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import JoinPage from './JoinPage';

// Mock dependencies
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignIn = vi.fn();
vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({ signIn: mockSignIn }),
}));

const mockJoinGame = vi.fn();
const mockConvexQuery = vi.fn();
vi.mock('convex/react', () => ({
  useMutation: () => mockJoinGame,
  useConvex: () => ({ query: mockConvexQuery }),
}));

vi.mock('@/hooks/use-pingo-auth', () => ({
  usePingoAuth: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    players: { join: 'mock-join' },
    games: { getByCode: 'mock-getByCode' },
  },
}));

import { usePingoAuth } from '@/hooks/use-pingo-auth';

describe('JoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(usePingoAuth).mockReturnValue({
      user: null as unknown as any,
      profile: null as unknown as any,
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: false
    });
  });

  it('renders correctly and lets user type code and nickname', () => {
    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Enter & Play/i)).toBeInTheDocument();
    
    // The inputs
    const codeInput = screen.getByLabelText(/Room Code/i) as HTMLInputElement;
    const nicknameInput = screen.getByLabelText(/Your Nickname/i) as HTMLInputElement;

    // Type a mixed string, should only keep A-Z and 0-9 up to 6 chars
    fireEvent.change(codeInput, { target: { value: 'a b-c!1234' } });
    expect(codeInput.value).toBe('ABC123'); // Max length 6 processed

    fireEvent.change(nicknameInput, { target: { value: 'Guest123' } });
    expect(nicknameInput.value).toBe('Guest123');

    // Button should be enabled since code length is 6 and nickname is given
    const joinBtn = screen.getByRole('button', { name: /Let's Play!/i });
    expect(joinBtn).not.toBeDisabled();
  });

  it('pre-fills code from URL search param', () => {
    render(
      <MemoryRouter initialEntries={['/join?code=qwe456']}>
        <JoinPage />
      </MemoryRouter>
    );

    const codeInput = screen.getByLabelText(/Room Code/i) as HTMLInputElement;
    expect(codeInput.value).toBe('QWE456');
  });

  it('shows error if game not found', async () => {
    mockConvexQuery.mockResolvedValueOnce(null);

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Room Code/i), { target: { value: 'XYZ789' } });
    fireEvent.change(screen.getByLabelText(/Your Nickname/i), { target: { value: 'Tester' } });
    fireEvent.click(screen.getByRole('button', { name: /Let's Play!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Game not found/i)).toBeInTheDocument();
    });
  });

  it('successfully joins a game as guest', async () => {
    mockConvexQuery.mockResolvedValueOnce({ _id: 'game-123', status: 'lobby' });
    mockJoinGame.mockResolvedValueOnce('player-xyz');
    mockSignIn.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Room Code/i), { target: { value: 'BINGO1' } });
    fireEvent.change(screen.getByLabelText(/Your Nickname/i), { target: { value: 'Tester' } });
    fireEvent.click(screen.getByRole('button', { name: /Let's Play!/i }));

    await waitFor(() => {
      // Should have called sign in anonymously since isAuthenticated was false
      expect(mockSignIn).toHaveBeenCalledWith('anonymous');
      // Should have joined game
      expect(mockJoinGame).toHaveBeenCalledWith({
        gameId: 'game-123',
        nickname: 'Tester',
        isHost: false,
      });
      // Should navigate to lobby
      expect(mockNavigate).toHaveBeenCalledWith('/lobby/game-123');
    });

    expect(localStorage.getItem('pingo_nickname')).toBe('Tester');
    expect(localStorage.getItem('pingo_player_game-123')).toBe('player-xyz');
  });

  it('uses authenticated profile nickname automatically', () => {
    vi.mocked(usePingoAuth).mockReturnValue({
      user: { email: 'a@b.com' } as any,
      profile: { id: 'usr', nickname: 'ProGamer', avatar_url: null },
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: true
    });

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    const nickInput = screen.getByLabelText(/Your Nickname/i) as HTMLInputElement;
    expect(nickInput.value).toBe('ProGamer');
    expect(localStorage.getItem('pingo_nickname')).toBe('ProGamer');
  });

  it('shows error when game has already started or ended', async () => {
    mockConvexQuery.mockResolvedValueOnce({ _id: 'game-123', status: 'active' });

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Room Code/i), { target: { value: 'STARTED' } });
    fireEvent.change(screen.getByLabelText(/Your Nickname/i), { target: { value: 'Tester' } });
    fireEvent.click(screen.getByRole('button', { name: /Let's Play!/i }));

    await waitFor(() => {
      expect(screen.getByText(/already started or ended/i)).toBeInTheDocument();
    });
  });

  it('shows server error message when joinGame mutation throws', async () => {
    mockConvexQuery.mockResolvedValueOnce({ _id: 'game-456', status: 'lobby' });
    mockSignIn.mockResolvedValueOnce(undefined);
    mockJoinGame.mockRejectedValueOnce(new Error('Lobby is full'));

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Room Code/i), { target: { value: 'ABCDE1' } });
    fireEvent.change(screen.getByLabelText(/Your Nickname/i), { target: { value: 'Tester' } });
    fireEvent.click(screen.getByRole('button', { name: /Let's Play!/i }));

    await waitFor(() => {
      expect(screen.getByText(/Lobby is full/i)).toBeInTheDocument();
    });
  });

  it('pre-fills nickname from localStorage if no profile', () => {
    localStorage.setItem('pingo_nickname', 'OldNick');

    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    const nickInput = screen.getByLabelText(/Your Nickname/i) as HTMLInputElement;
    expect(nickInput.value).toBe('OldNick');
  });

  it('join button stays disabled when code is shorter than 6 characters', () => {
    render(
      <MemoryRouter initialEntries={['/join']}>
        <JoinPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Room Code/i), { target: { value: 'ABC' } });
    fireEvent.change(screen.getByLabelText(/Your Nickname/i), { target: { value: 'Tester' } });

    expect(screen.getByRole('button', { name: /Let's Play!/i })).toBeDisabled();
  });
});
