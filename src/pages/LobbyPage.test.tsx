/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LobbyPage from './LobbyPage';
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import { useQuery, useMutation } from 'convex/react';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/use-pingo-auth', () => ({
  usePingoAuth: vi.fn(),
}));

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    games: { getWithSheet: 'mock-getWithSheet', start: 'mock-start' },
    players: { getForGame: 'mock-getForGame', updateBoard: 'mock-updateBoard' },
  },
}));

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
  share: undefined,
});

describe('LobbyPage', () => {
  const mockStartGame = vi.fn();
  const mockUpdateBoard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(usePingoAuth).mockReturnValue({
      user: { email: 'a' } as unknown as any,
      profile: { id: 'usr_1' as any, nickname: 'Host', avatar_url: null },
      isLoading: false,
      signOut: vi.fn(),
      isAuthenticated: true
    });
    vi.mocked(useMutation).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-start') return mockStartGame;
      if (apiFn === 'mock-updateBoard') return mockUpdateBoard;
      return vi.fn();
    });
  });

  const renderLobby = (gameId = 'g1') => {
    return render(
      <MemoryRouter initialEntries={[`/lobby/${gameId}`]}>
        <Routes>
          <Route path="/lobby/:id" element={<LobbyPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    const { container } = renderLobby();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects unauthorized users to home', async () => {
    // Current player not in the players list
    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { _id: 'g1', roomCode: 'ROOM1', status: 'lobby', lastActivityAt: Date.now() };
      if (apiFn === 'mock-getForGame') return [];
      return undefined;
    });

    renderLobby();

    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    }, { timeout: 4000 });
  });

  it('displays game details and players correctly as host', () => {
    localStorage.setItem('pingo_player_g1', 'p1');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'lobby', 
        config: { minTwoPlayers: true }, 
        lastActivityAt: Date.now() 
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, _creationTime: Date.now() },
        { _id: 'p2', nickname: 'Guest1', isHost: false, _creationTime: Date.now() },
      ];
      return undefined;
    });

    renderLobby();

    expect(screen.getAllByText('ROOM12')[0]).toBeInTheDocument();
    expect(screen.getByText('2/12')).toBeInTheDocument(); // Players joined
    expect(screen.getAllByText('Host')[0]).toBeInTheDocument();
    expect(screen.getByText('Guest1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Game/i })).toBeInTheDocument();
  });

  it('prevents starting if minTwoPlayers is true and only 1 player', async () => {
    localStorage.setItem('pingo_player_g1', 'p1');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'lobby', 
        config: { minTwoPlayers: true }, 
        lastActivityAt: Date.now(),
        sheet: { items: new Array(25).fill('A'), _creationTime: Date.now() }
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, _creationTime: Date.now() },
      ];
      return undefined;
    });

    renderLobby();
    
    const startBtn = screen.getByRole('button', { name: /Waiting for players\.\.\./i });
    expect(startBtn).toBeDisabled();
  });

  it('allows host to start game and navigates to game page', async () => {
    localStorage.setItem('pingo_player_g1', 'p1');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'lobby', 
        config: { minTwoPlayers: false }, 
        lastActivityAt: Date.now(),
        sheet: { items: new Array(30).fill('A').map((n, i) => i.toString()), _creationTime: Date.now() }
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, gameId: 'g1', _creationTime: Date.now() },
      ];
      return undefined;
    });

    renderLobby();
    
    const startBtn = screen.getByRole('button', { name: /Start Game/i });
    expect(startBtn).not.toBeDisabled();
    
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledTimes(1);
      expect(mockStartGame).toHaveBeenCalledWith({ gameId: 'g1' });
      expect(mockNavigate).toHaveBeenCalledWith('/game/g1');
    });
  });

  it('shows waiting UI for non-host player', () => {
    localStorage.setItem('pingo_player_g1', 'p2');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'lobby', 
        lastActivityAt: Date.now() 
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, _creationTime: Date.now() },
        { _id: 'p2', nickname: 'Guest', isHost: false, _creationTime: Date.now() },
      ];
      return undefined;
    });

    renderLobby();

    expect(screen.getByText(/Waiting for host to start/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start Game/i })).not.toBeInTheDocument();
  });

  it('navigates to game if status becomes active', () => {
    localStorage.setItem('pingo_player_g1', 'p2');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'active', // <--- NOTE: ACTIVE
        lastActivityAt: Date.now() 
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, _creationTime: Date.now() },
        { _id: 'p2', nickname: 'Guest', isHost: false, _creationTime: Date.now() },
      ];
      return undefined;
    });

    renderLobby();

    expect(mockNavigate).toHaveBeenCalledWith('/game/g1');
  });

  it('can copy invite link', async () => {
    localStorage.setItem('pingo_player_g1', 'p1');

    vi.mocked(useQuery).mockImplementation((apiFn: any) => {
      if (apiFn === 'mock-getWithSheet') return { 
        _id: 'g1', 
        roomCode: 'ROOM12', 
        status: 'lobby', 
        lastActivityAt: Date.now() 
      };
      if (apiFn === 'mock-getForGame') return [
        { _id: 'p1', nickname: 'Host', isHost: true, _creationTime: Date.now() }
      ];
      return undefined;
    });

    renderLobby();

    expect(screen.getAllByText('ROOM12')[0]).toBeInTheDocument(); // Should render multiple times
    const codeDisplay = screen.getByText('Click to Copy Code');
    fireEvent.click(codeDisplay); // Copies to clipboard

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ROOM12');
      expect(screen.getByText('Room Code Copied!')).toBeInTheDocument();
    });
  });
});
