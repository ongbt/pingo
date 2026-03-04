/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import GamePage from './GamePage';
import { useQuery, useMutation } from 'convex/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    games: { getWithSheet: 'mock-getWithSheet', end: 'mock-end' },
    players: {
      getForGame: 'mock-getForGame',
      updateBoard: 'mock-updateBoard',
      claimBingo: 'mock-claimBingo',
      leave: 'mock-leave',
    },
  },
}));

// canvas-confetti is irrelevant to rendering; stub it silently
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// ─── Shared fixtures ───────────────────────────────────────────────────────────

const GAME_ID = 'game-abc';
const PLAYER_STORAGE_KEY = `pingo_player_${GAME_ID}`;

const makeGame = (overrides: Record<string, unknown> = {}) => ({
  _id: GAME_ID,
  roomCode: 'ROOM12',
  status: 'active',
  hostId: 'p1',
  sheetId: 'sheet1',
  config: { minTwoPlayers: false },
  lastActivityAt: Date.now(),
  sheet: {
    _id: 'sheet1',
    title: 'Test Sheet',
    items: Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`),
    isDefault: true,
    creatorId: null,
    playCount: 5,
    _creationTime: Date.now(),
  },
  ...overrides,
});

const makePlayer = (overrides: Record<string, unknown> = {}) => ({
  _id: 'p1',
  gameId: GAME_ID,
  authId: null,
  nickname: 'Host',
  isHost: true,
  boardState: [],
  boardLayout: Array.from({ length: 25 }, (_, i) => i),
  score: 0,
  isWinner: false,
  bingoRank: null,
  _creationTime: Date.now(),
  ...overrides,
});

// ─── Setup helpers ─────────────────────────────────────────────────────────────

const mockUpdateBoard = vi.fn().mockResolvedValue(undefined);
const mockClaimBingo = vi.fn().mockResolvedValue(undefined);
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockLeave = vi.fn().mockResolvedValue(undefined);

const renderGame = (gameId = GAME_ID) =>
  render(
    <MemoryRouter initialEntries={[`/game/${gameId}`]}>
      <Routes>
        <Route path="/game/:id" element={<GamePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(useMutation).mockImplementation((..._args: any[]) => {
      const apiFn = _args[0];
      let mockFn: any;
      if (apiFn === 'mock-updateBoard') mockFn = mockUpdateBoard;
      else if (apiFn === 'mock-claimBingo') mockFn = mockClaimBingo;
      else if (apiFn === 'mock-end') mockFn = mockEnd;
      else if (apiFn === 'mock-leave') mockFn = mockLeave;
      else mockFn = vi.fn();

      mockFn.withOptimisticUpdate = vi.fn().mockReturnValue(mockFn);
      return mockFn;
    });
  });

  // ─── Loading state ──────────────────────────────────────────────────────────

  it('shows loading spinner while data is loading', () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    const { container } = renderGame();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // ─── Active game rendering ──────────────────────────────────────────────────

  it('renders the bingo board with 25 cells when game data is loaded', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    const { container } = renderGame();

    // The grid should have exactly 25 cells (buttons)
    const cells = container.querySelectorAll('main button');
    expect(cells).toHaveLength(25);
  });

  it('shows the sheet title in the header', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    renderGame();
    expect(screen.getByText('Test Sheet')).toBeInTheDocument();
  });

  it('shows player nicknames in the leaderboard', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [
        makePlayer({ _id: 'p1', nickname: 'Alice', score: 10 }),
        makePlayer({ _id: 'p2', nickname: 'Bob', isHost: false, score: 5 }),
      ];
      return undefined;
    });

    renderGame();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('center cell (index 12) is always marked as FREE and not clickable', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    const { container } = renderGame();
    const cells = container.querySelectorAll('main button');
    const centerCell = cells[12];
    expect(centerCell).toBeDisabled();
  });

  // ─── Marking cells ──────────────────────────────────────────────────────────

  it('marks a cell when clicked and calls updateBoard', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    const { container } = renderGame();
    const cells = container.querySelectorAll('main button');
    const firstCell = cells[0];

    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledWith({
        playerId: 'p1',
        boardState: [0],
      });
    });
  });

  it('un-marks a previously marked cell and calls updateBoard', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      // Player already has index 0 marked
      if (apiFn === 'mock-getForGame') return [makePlayer({ boardState: [0] })];
      return undefined;
    });

    const { container } = renderGame();
    const cells = container.querySelectorAll('main button');
    const firstCell = cells[0];

    // Click again to un-mark
    fireEvent.click(firstCell);

    await waitFor(() => {
      expect(mockUpdateBoard).toHaveBeenCalledWith({
        playerId: 'p1',
        boardState: [],
      });
    });
  });

  // ─── Quit ───────────────────────────────────────────────────────────────────

  it('Quit button is disabled for the host', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()]; // host
      return undefined;
    });

    renderGame();
    const quitBtn = screen.getByRole('button', { name: /Quit/i });
    expect(quitBtn).toBeDisabled();
  });

  it('non-host can quit: calls leave mutation and navigates home', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p2');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [
        makePlayer({ _id: 'p1', isHost: true }),
        makePlayer({ _id: 'p2', nickname: 'Guest', isHost: false }),
      ];
      return undefined;
    });

    renderGame();
    const quitBtn = screen.getByRole('button', { name: /Quit/i });
    expect(quitBtn).not.toBeDisabled();

    fireEvent.click(quitBtn);

    await waitFor(() => {
      expect(mockLeave).toHaveBeenCalledWith({ playerId: 'p2' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // ─── End Game (host) ────────────────────────────────────────────────────────

  it('shows End Game button for host', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    renderGame();
    expect(screen.getByRole('button', { name: /End Game/i })).toBeInTheDocument();
  });

  it('opens confirmation modal when End Game is clicked', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /End Game/i }));

    await waitFor(() => {
      expect(screen.getByText(/End the Game\?/i)).toBeInTheDocument();
    });
  });

  it('cancels the confirmation modal without ending the game', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /End Game/i }));

    await waitFor(() => screen.getByText(/End the Game\?/i));

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    await waitFor(() => {
      expect(screen.queryByText(/End the Game\?/i)).not.toBeInTheDocument();
    });
    expect(mockEnd).not.toHaveBeenCalled();
  });

  it('confirms End Game and calls end mutation', async () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame();
      if (apiFn === 'mock-getForGame') return [makePlayer()];
      return undefined;
    });

    const { container } = renderGame();
    // Open the modal
    fireEvent.click(container.querySelector('#end-game-btn') as HTMLElement);

    await waitFor(() => screen.getByText(/End the Game\?/i));

    // Click the confirm button inside the modal (id disambiguates from the floating host button)
    const confirmBtn = container.querySelector('#end-game-confirm-btn') as HTMLElement;
    expect(confirmBtn).not.toBeNull();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockEnd).toHaveBeenCalledWith({ gameId: GAME_ID });
    });
  });

  // ─── Winner / Game Over screens ─────────────────────────────────────────────

  it('shows winner overlay when a player is marked as winner', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame({ status: 'finished' });
      if (apiFn === 'mock-getForGame') return [
        makePlayer({ _id: 'p1', nickname: 'Alice', isWinner: true, score: 5 }),
      ];
      return undefined;
    });

    renderGame();
    expect(screen.getByText('Bingo!')).toBeInTheDocument();
    expect(screen.getByText('Alice Won!')).toBeInTheDocument();
  });

  it('shows Game Over overlay when game is finished but no winner', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame({ status: 'finished' });
      if (apiFn === 'mock-getForGame') return [
        makePlayer({ _id: 'p1', isWinner: false }),
      ];
      return undefined;
    });

    renderGame();
    expect(screen.getByText(/Game Over/i)).toBeInTheDocument();
    expect(screen.getByText(/host ended the game/i)).toBeInTheDocument();
  });

  it('Play Again button on winner screen navigates home', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'p1');

    vi.mocked(useQuery).mockImplementation((...args: any[]) => {
      const apiFn = args[0];
      if (apiFn === 'mock-getWithSheet') return makeGame({ status: 'finished' });
      if (apiFn === 'mock-getForGame') return [
        makePlayer({ _id: 'p1', nickname: 'Alice', isWinner: true, score: 5 }),
      ];
      return undefined;
    });

    renderGame();
    const playAgainBtns = screen.getAllByRole('button', { name: /Play Again/i });
    fireEvent.click(playAgainBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
