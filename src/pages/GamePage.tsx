import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Game, Player, Sheet } from '@/types';
import { cn } from '@/lib/utils';
import {
  LogOut,
  Grid3X3,
  Star,
  PartyPopper,
  Volume2,
  Settings,
  Trophy,
  ShieldCheck,
  Eye,
  OctagonX,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Id, Doc } from '../../convex/_generated/dataModel';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = id as Id<'game'>;

  const gameResult = useQuery(api.games.getWithSheet, { gameId });
  const playersResult = useQuery(api.players.getForGame, { gameId });
  const updatePlayerBoard = useMutation(api.players.updateBoard);
  const claimBingoMutation = useMutation(api.players.claimBingo);
  const endMutation = useMutation(api.games.end);
  const leaveMutation = useMutation(api.players.leave);

  const [marked, setMarked] = useState<number[]>([]);
  const [isSpectating, setIsSpectating] = useState(false);
  const [isEndGameOpen, setIsEndGameOpen] = useState(false);
  const [lastMarked, setLastMarked] = useState<{
    nickname: string;
    item: string;
  } | null>(null);
  const [lastLeft, setLastLeft] = useState<string | null>(null);
  const [lastBingo, setLastBingo] = useState<{
    nickname: string;
    rank: number;
  } | null>(null);

  const game = useMemo(() => {
    if (!gameResult) return null;
    return {
      id: gameResult._id,
      room_code: gameResult.roomCode,
      host_id: gameResult.hostId ?? null,
      sheet_id: gameResult.sheetId,
      status: gameResult.status,
      config: gameResult.config,
      last_activity_at: new Date(gameResult.lastActivityAt).toISOString(),
      sheet: gameResult.sheet
        ? {
            id: gameResult.sheet._id,
            title: gameResult.sheet.title,
            items: gameResult.sheet.items,
            is_default: gameResult.sheet.isDefault,
            creator_id: gameResult.sheet.creatorId ?? null,
            play_count: gameResult.sheet.playCount,
            created_at: new Date(gameResult.sheet._creationTime).toISOString(),
          }
        : undefined,
    } as unknown as Game & { sheet: Sheet };
  }, [gameResult]);

  const players = useMemo(() => {
    if (!playersResult) return [];
    return (playersResult as Doc<'player'>[]).map(
      (p) =>
        ({
          id: p._id,
          game_id: p.gameId,
          auth_id: p.authId ?? null,
          nickname: p.nickname,
          is_host: p.isHost,
          board_state: p.boardState,
          board_layout: p.boardLayout ?? null,
          score: p.score,
          is_winner: p.isWinner,
          bingo_rank: p.bingoRank ?? null,
          created_at: new Date(p._creationTime).toISOString(),
        }) as Player
    );
  }, [playersResult]);

  const currentPlayer = useMemo(() => {
    const savedPlayerId = localStorage.getItem(`pingo_player_${gameId}`);
    return (players as Player[]).find((p) => p.id === savedPlayerId) ?? null;
  }, [players, gameId]);

  // Sync internal 'marked' state with DB on load
  const [hasSyncedMarked, setHasSyncedMarked] = useState(false);
  useEffect(() => {
    if (currentPlayer && !hasSyncedMarked) {
      setMarked((currentPlayer.board_state as number[]) || []);
      setHasSyncedMarked(true);
    }
  }, [currentPlayer, hasSyncedMarked]);

  const loading = gameResult === undefined || playersResult === undefined;

  // Track changes for notifications
  const prevPlayersRef = useRef<Player[]>([]);
  useEffect(() => {
    if (!playersResult || !game) return;

    // Detect new winners
    players.forEach((p) => {
      const oldP = prevPlayersRef.current.find((old) => old.id === p.id);
      if (p.is_winner && (!oldP || !oldP.is_winner)) {
        setLastBingo({ nickname: p.nickname, rank: 1 }); // Rank logic simplified in Convex for now
        setTimeout(() => setLastBingo(null), 5000);
      }

      // Detect board state updates for toasts
      if (p.board_state && oldP?.board_state) {
        const newState = p.board_state as number[];
        const oldState = oldP.board_state as number[];
        if (newState.length > oldState.length) {
          const newIndex = newState.find((idx) => !oldState.includes(idx));
          if (newIndex !== undefined) {
            const layout = p.board_layout as number[] | null;
            const itemIndex = layout ? layout[newIndex] : newIndex;
            setLastMarked({
              nickname: p.nickname,
              item: game.sheet.items[itemIndex],
            });
            setTimeout(() => setLastMarked(null), 3000);
          }
        }
      }
    });

    // Detect departures
    prevPlayersRef.current.forEach((oldP) => {
      if (!players.find((p) => p.id === oldP.id)) {
        setLastLeft(oldP.nickname);
        setTimeout(() => setLastLeft(null), 3000);
      }
    });

    prevPlayersRef.current = players;
  }, [players, game, playersResult]);

  const boardItems = useMemo(() => {
    if (!game) return [];
    const layout = currentPlayer?.board_layout as number[] | null;
    if (layout && layout.length === 25) {
      return layout.map((idx) => game.sheet.items[idx]);
    }
    return game.sheet.items.slice(0, 25);
  }, [game, currentPlayer]);

  // 3. Bingo Logic
  const hasBingo = useMemo(() => {
    const wins = [
      [0, 1, 2, 3, 4],
      [5, 6, 7, 8, 9],
      [10, 11, 12, 13, 14],
      [15, 16, 17, 18, 19],
      [20, 21, 22, 23, 24], // Horizontal
      [0, 5, 10, 15, 20],
      [1, 6, 11, 16, 21],
      [2, 7, 12, 17, 22],
      [3, 8, 13, 18, 23],
      [4, 9, 14, 19, 24], // Vertical
      [0, 6, 12, 18, 24],
      [4, 8, 12, 16, 20], // Diagonal
    ];
    // Use a Set for O(1) lookups instead of O(n) Array.includes()
    const markedSet = new Set([...marked, 12]);
    return wins.some((line) => line.every((idx) => markedSet.has(idx)));
  }, [marked]);

  const playersLoadedRef = useRef(false);
  useEffect(() => {
    if (!loading) playersLoadedRef.current = true;
  }, [loading]);

  const isWritingRef = useRef(false);
  const toggleMark = async (index: number) => {
    if (index === 12 || !currentPlayer || !game || game.status === 'finished')
      return;
    if (isWritingRef.current) return;

    const newMarked = marked.includes(index)
      ? marked.filter((i) => i !== index)
      : [...marked, index];

    setMarked(newMarked);
    // Convex update
    try {
      isWritingRef.current = true;
      await updatePlayerBoard({
        playerId: currentPlayer.id as Id<'player'>,
        boardState: newMarked,
      });
    } catch (e) {
      console.error('Failed to update board', e);
    } finally {
      isWritingRef.current = false;
    }
  };

  const handleBingo = async () => {
    if (!hasBingo || !currentPlayer || !game || currentPlayer.is_winner) return;
    try {
      await claimBingoMutation({ playerId: currentPlayer.id as Id<'player'> });
    } catch (e) {
      console.error('Failed to claim bingo', e);
    }
  };

  const handleEndGame = async () => {
    if (!game || !currentPlayer?.is_host) return;
    try {
      await endMutation({ gameId });
      setIsEndGameOpen(false);
    } catch (e) {
      console.error('Failed to end game', e);
    }
  };

  const handleQuit = async () => {
    if (!currentPlayer) {
      navigate('/');
      return;
    }
    if (currentPlayer.is_host) return;

    try {
      await leaveMutation({ playerId: currentPlayer.id as Id<'player'> });
      localStorage.removeItem(`pingo_player_${gameId}`);
      navigate('/');
    } catch (e) {
      console.error('Failed to leave game', e);
    }
  };

  const winner = useMemo(() => {
    return players.find((p) => p.is_winner) || null;
  }, [players]);

  useEffect(() => {
    if (!winner) return;
    let active = true;
    const end = Date.now() + 3 * 1000;
    const colors = ['#f47b25', '#fcd34d', '#22c55e', '#3b82f6'];

    (function frame() {
      if (!active) return;
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    return () => {
      active = false;
    };
  }, [winner]);

  const sortedPlayers = useMemo(() => {
    const pList = [...players] as Player[];
    return pList.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

  // Enforce minTwoPlayers during gameplay
  useEffect(() => {
    if (!playersLoadedRef.current || !game || game.status !== 'active') return;

    const minTwoPlayers =
      typeof game.config === 'object' &&
      game.config !== null &&
      !Array.isArray(game.config)
        ? (((game.config as Record<string, unknown>).minTwoPlayers as
            | boolean
            | undefined) ?? false)
        : false;

    if (minTwoPlayers && players.length < 2) {
      endMutation({ gameId }).catch((e) =>
        console.error('Failed to end game on drop', e)
      );
    }
  }, [game, players.length, gameId, endMutation]);

  // Game session timeout
  const gameTimeoutMin =
    typeof game?.config === 'object' &&
    game.config !== null &&
    !Array.isArray(game.config)
      ? (((game.config as Record<string, unknown>).game_timeout_min as
          | number
          | undefined) ?? 30)
      : 30;

  const handleGameExpire = useCallback(() => {
    navigate('/', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameTimeout = useSessionTimeout({
    lastActivityAt: game?.last_activity_at,
    timeoutMinutes: gameTimeoutMin,
    onExpire: handleGameExpire,
  });

  if (loading || !game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#e0f2fe] dark:bg-slate-900">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, #bae6fd 15deg 30deg)',
            }}
          />
        </div>
        {/* Bingo Balls */}
        <div className="absolute -bottom-16 -left-16 h-64 w-64 opacity-60">
          <div className="absolute bottom-10 left-10 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/50 bg-[#fcd34d] text-4xl font-black text-white/80">
            30
          </div>
          <div className="absolute bottom-24 left-24 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-[#f47b25] text-2xl font-black text-white/80">
            9
          </div>
        </div>
        <div className="absolute left-10 top-20 animate-bounce text-[#fef08a] opacity-80">
          <Star size={40} fill="currentColor" />
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-primary/10 bg-white/80 px-4 py-3 backdrop-blur-md dark:bg-background-dark/80">
        <div className="flex items-center gap-2">
          <Grid3X3 className="text-primary" />
          <h1 className="max-w-[150px] truncate text-xl font-black uppercase tracking-tight">
            {game.sheet.title}
          </h1>
        </div>
        {/* Game timeout pill - only shown when <= 10 mins remaining */}
        <AnimatePresence>
          {game.status !== 'finished' &&
            gameTimeout.secondsLeft !== null &&
            gameTimeout.secondsLeft <= 600 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={
                  gameTimeout.isUrgent
                    ? { scale: [1, 1.05, 1], opacity: 1 }
                    : { scale: 1, opacity: 1 }
                }
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{
                  duration: 0.5,
                  repeat: gameTimeout.isUrgent ? Infinity : 0,
                }}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors',
                  gameTimeout.isUrgent
                    ? 'border border-red-200 bg-red-100 text-red-600 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-400'
                    : 'border border-orange-200 bg-orange-100 text-orange-600 dark:border-orange-800/50 dark:bg-orange-900/30 dark:text-orange-400'
                )}
                title="Game auto-ends due to inactivity"
              >
                <Timer
                  size={12}
                  className={cn(gameTimeout.isUrgent && 'animate-pulse')}
                />
                <span>
                  Idle:{' '}
                  <span className="tabular-nums">{gameTimeout.label}</span>
                </span>
              </motion.div>
            )}
        </AnimatePresence>
        <button
          onClick={handleQuit}
          disabled={currentPlayer?.is_host}
          title={
            currentPlayer?.is_host
              ? 'Use End Game to stop the session'
              : 'Quit game'
          }
          className="flex items-center gap-1 rounded-full bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:pointer-events-none disabled:opacity-30"
        >
          <LogOut size={14} />
          Quit
        </button>
      </header>

      {/* Mini Leaderboard */}
      <section className="px-4 py-6">
        <div className="flex items-center justify-center gap-6">
          {sortedPlayers.slice(0, 3).map((p, i) => (
            <div
              key={p.id}
              className={cn(
                'flex flex-col items-center gap-1',
                i === 0
                  ? '-order-1 scale-110'
                  : i === 1
                    ? 'order-first mt-4'
                    : 'order-last mt-4'
              )}
            >
              <div className="relative">
                {i === 0 && (
                  <Trophy
                    className="absolute -top-6 left-1/2 -translate-x-1/2 fill-primary text-primary"
                    size={24}
                  />
                )}
                <img
                  alt={p.nickname}
                  className={cn(
                    'rounded-full object-cover shadow-lg',
                    i === 0
                      ? 'size-16 border-4 border-primary'
                      : 'size-12 border-2 border-white dark:border-slate-800'
                  )}
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${p.nickname}`}
                />
                <div
                  className={cn(
                    'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-md',
                    i === 0
                      ? 'bg-primary'
                      : i === 1
                        ? 'bg-slate-400'
                        : 'bg-amber-700'
                  )}
                >
                  {i + 1}
                </div>
              </div>
              <p className="w-16 truncate text-center text-[10px] font-black uppercase tracking-tighter">
                {p.nickname}
              </p>
              <p
                className={cn(
                  'text-[9px] font-bold uppercase',
                  i === 0 ? 'text-primary' : 'text-slate-500'
                )}
              >
                {p.score || 0} pts
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Notification Toast */}
      <AnimatePresence>
        {lastMarked && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="pointer-events-none fixed left-1/2 top-24 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-primary/20 bg-white/95 px-6 py-2 shadow-xl backdrop-blur-sm dark:bg-slate-800/95">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              <p className="text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300">
                <span className="text-primary">{lastMarked.nickname}</span>{' '}
                marked{' '}
                <span className="italic text-slate-900 underline decoration-primary/30 decoration-2 dark:text-white">
                  &quot;{lastMarked.item}&quot;
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Left Toast */}
      <AnimatePresence>
        {lastLeft && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="pointer-events-none fixed left-1/2 top-36 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-red-200 bg-white/95 px-6 py-2 shadow-xl backdrop-blur-sm dark:border-red-900/40 dark:bg-slate-800/95">
              <LogOut size={12} className="shrink-0 text-red-400" />
              <p className="text-xs font-black uppercase tracking-tight text-slate-600 dark:text-slate-300">
                <span className="text-red-400">{lastLeft}</span> has left the
                game
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bingo Claim Toast */}
      <AnimatePresence>
        {lastBingo && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed left-1/2 top-48 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 shadow-2xl backdrop-blur-sm">
              <PartyPopper
                size={20}
                className="shrink-0 animate-bounce text-white"
              />
              <p className="text-sm font-black uppercase tracking-tight text-white">
                {lastBingo.nickname} got Bingo!
                <span className="ml-2 italic text-yellow-100">
                  (#{lastBingo.rank})
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bingo Grid */}
      <main className="mx-auto w-full max-w-md flex-grow px-4 pb-32">
        <div className="grid grid-cols-5 gap-2.5 rounded-[2.5rem] border border-white/20 bg-white/30 p-4 shadow-inner backdrop-blur-sm sm:gap-4 dark:bg-white/5">
          {boardItems.map((item, i) => {
            const isCenter = i === 12;
            const isMarked = marked.includes(i) || isCenter;

            return (
              <button
                key={i}
                disabled={isCenter}
                onClick={() => toggleMark(i)}
                className={cn(
                  'group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl p-2 text-center text-[9px] font-black uppercase leading-[1.1] transition-all duration-300 active:scale-95',
                  isMarked
                    ? 'border-primary-dark translate-y-[-2px] border-b-4 bg-primary text-white shadow-lg shadow-primary/30 brightness-105'
                    : 'border-b-4 border-slate-200 bg-white/80 text-slate-800 hover:border-primary/50 dark:border-slate-900 dark:bg-slate-800/80 dark:text-slate-200'
                )}
              >
                {isCenter ? (
                  <Star fill="white" className="h-6 w-6 animate-pulse" />
                ) : (
                  <>
                    <span className="relative z-10 drop-shadow-sm">{item}</span>
                    <div
                      className={cn(
                        'absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100',
                        isMarked && 'opacity-0'
                      )}
                    />
                  </>
                )}
                {isMarked && !isCenter && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/20"
                  >
                    <Star className="h-8 w-8 fill-white/10 text-white/30" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* BINGO Button */}
      <AnimatePresence>
        {hasBingo && !currentPlayer?.is_winner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center bg-gradient-to-t from-white via-white/80 to-transparent p-8 dark:from-background-dark dark:via-background-dark/80"
          >
            <button
              onClick={handleBingo}
              disabled={game.status === 'finished'}
              className="group pointer-events-auto relative flex h-20 w-full max-w-xs transform items-center justify-center gap-4 rounded-[2rem] border-b-8 border-[#c65e18] bg-primary text-white shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:translate-y-2 active:border-b-0 disabled:pointer-events-none disabled:opacity-50"
            >
              <PartyPopper size={36} className="animate-bounce" />
              <span className="text-4xl font-black uppercase italic tracking-tighter drop-shadow-md">
                Bingo!
              </span>
              <PartyPopper size={36} className="animate-bounce" />
              {/* Particle Burst Mockup */}
              <div className="pointer-events-none absolute -top-10 left-0 h-full w-full">
                <Star className="absolute left-1/4 top-0 h-4 w-4 animate-ping text-primary" />
                <Star className="absolute right-1/4 top-4 h-5 w-5 animate-ping text-yellow-400" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tools */}
      <nav className="fixed bottom-6 right-6 z-40 flex flex-col gap-4">
        <button className="flex size-12 items-center justify-center rounded-2xl border border-white/50 bg-white text-slate-600 shadow-xl backdrop-blur-sm transition-transform active:scale-95 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300">
          <Volume2 size={24} />
        </button>
        <button className="flex size-12 items-center justify-center rounded-2xl border border-white/50 bg-white text-slate-600 shadow-xl backdrop-blur-sm transition-transform active:scale-95 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300">
          <Settings size={24} />
        </button>
      </nav>

      {/* GAME OVER OVERLAY (Host Force-Ended — No Winner) */}
      <AnimatePresence>
        {!winner && game.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex w-full max-w-sm flex-col items-center"
            >
              <div className="mb-8 flex size-24 items-center justify-center rounded-3xl bg-slate-700/60 shadow-xl">
                <OctagonX size={48} className="text-red-400" />
              </div>

              <h2 className="mb-2 text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
                Game Over
              </h2>
              <p className="mb-10 text-sm font-bold uppercase tracking-widest text-slate-400">
                {(game.config as Record<string, unknown>)?.minTwoPlayers &&
                players.length < 2
                  ? 'Not enough players to continue'
                  : 'The host ended the game'}
              </p>

              <div className="mb-8 w-full rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-300">
                  Final Standings
                </p>
                <div className="flex flex-col gap-2">
                  {sortedPlayers.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-4 text-xs font-black text-slate-500">
                        #{i + 1}
                      </span>
                      <img
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${p.nickname}`}
                        alt={p.nickname}
                        className="size-7 rounded-full border border-white/20"
                      />
                      <span className="flex-1 truncate text-left text-xs font-bold text-white">
                        {p.nickname}
                      </span>
                      <span className="text-xs font-black text-slate-400">
                        {p.score || 0} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="border-primary-dark h-16 w-full rounded-2xl border-b-4 bg-primary font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all active:translate-y-1 active:border-b-0"
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINNER SCREEN OVERLAY */}
      <AnimatePresence>
        {game.status === 'finished' && winner && !isSpectating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 p-6 text-center backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative flex w-full max-w-sm flex-col items-center"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  className="absolute inset-[-40px] opacity-30"
                >
                  <Star
                    fill="#f47b25"
                    size={200}
                    className="h-full w-full text-primary"
                  />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative z-10 size-40 overflow-hidden rounded-full border-8 border-primary shadow-2xl"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${winner.nickname}`}
                    alt={winner.nickname}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
                <div className="absolute -right-6 -top-6 z-20 rotate-12 rounded-2xl bg-yellow-400 p-3 shadow-lg">
                  <Trophy size={32} className="fill-white text-white" />
                </div>
              </div>

              <h2 className="mb-2 text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg">
                Bingo!
              </h2>
              <p className="mb-8 text-2xl font-black uppercase tracking-widest text-primary">
                {winner.nickname} Won!
              </p>

              <div className="mb-8 w-full rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Board Marks
                  </span>
                  <span className="text-xl font-black text-white">
                    {winner.score}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(winner.score / 25) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              <div className="flex w-full flex-col gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="border-primary-dark h-16 rounded-2xl border-b-4 bg-primary font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all active:translate-y-1 active:border-b-0"
                >
                  Play Again
                </button>
                {!(game.config as { firstBingoWins?: boolean })
                  ?.firstBingoWins && (
                  <button
                    onClick={() => setIsSpectating(true)}
                    className="flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 font-black uppercase tracking-widest text-white transition-all hover:bg-white/20"
                  >
                    <Eye size={18} />
                    Spectate
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Controls */}
      {currentPlayer?.is_host && (
        <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
          <button
            id="end-game-btn"
            onClick={() => setIsEndGameOpen(true)}
            disabled={game.status === 'finished'}
            className="flex items-center gap-2 rounded-xl bg-red-600/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition-colors hover:bg-red-500 disabled:pointer-events-none disabled:opacity-40"
          >
            <OctagonX size={14} />
            End Game
          </button>
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-md">
            <ShieldCheck size={14} className="text-green-500" />
            Host Mode
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      <AnimatePresence>
        {isEndGameOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-red-200 bg-white p-8 shadow-2xl dark:border-red-900/50 dark:bg-slate-900"
            >
              <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
                <OctagonX size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="mb-1 text-xl font-black uppercase tracking-tight">
                  End the Game?
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This will immediately end the game for{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    all players
                  </span>
                  . This cannot be undone.
                </p>
              </div>
              <div className="flex w-full gap-3">
                <button
                  id="end-game-cancel-btn"
                  onClick={() => setIsEndGameOpen(false)}
                  className="h-12 flex-1 rounded-2xl bg-slate-100 text-sm font-black uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  id="end-game-confirm-btn"
                  onClick={handleEndGame}
                  className="h-12 flex-1 rounded-2xl bg-red-500 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600"
                >
                  End Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spectating Badge */}
      {isSpectating && winner && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className="flex items-center gap-2 rounded-xl bg-primary/90 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-md">
            <Eye size={14} />
            Spectating
          </div>
        </div>
      )}
    </div>
  );
}
