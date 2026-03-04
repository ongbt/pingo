import { useCallback, useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import { Game, Player } from '@/types';
import { cn } from '@/lib/utils';
import {
  Copy,
  Share2,
  ArrowLeft,
  UserPlus,
  Star,
  CheckCircle,
  ShieldOff,
  Timer,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/components/ErrorDialog';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Id } from '../../convex/_generated/dataModel';

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  usePingoAuth(); // Keep for auth side effects if any, though usePingoAuth is usually reactive

  const gameId = id as Id<'game'>;
  const gameResult = useQuery(api.games.getWithSheet, { gameId });
  const playersResult = useQuery(api.players.getForGame, { gameId });
  const startGameMutation = useMutation(api.games.start);
  const updatePlayerBoard = useMutation(api.players.updateBoard);

  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const showError = (title: string, message: string) =>
    setDialog({ title, message });

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
    } as unknown as Game;
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

  const loading = gameResult === undefined || playersResult === undefined;
  const isUnauthorized = !loading && !currentPlayer;

  // Auto-redirect unauthorized visitors back to home after a short delay
  useEffect(() => {
    if (!isUnauthorized) return;
    const t = setTimeout(() => navigate('/', { replace: true }), 3000);
    return () => clearTimeout(t);
  }, [isUnauthorized, navigate]);

  // Effect to navigate if game goes active
  useEffect(() => {
    if (game?.status === 'active') {
      navigate(`/game/${gameId}`);
    }
  }, [game?.status, gameId, navigate]);

  // Read configurable thresholds from game.config (defaults: 15 min lobby, 30 min game)
  const lobbyTimeoutMin =
    typeof game?.config === 'object' &&
    game.config !== null &&
    !Array.isArray(game.config)
      ? (((game.config as Record<string, unknown>).lobby_timeout_min as
          | number
          | undefined) ?? 15)
      : 15;

  const handleLobbyExpire = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  const timeout = useSessionTimeout({
    lastActivityAt: game?.last_activity_at,
    timeoutMinutes: lobbyTimeoutMin,
    onExpire: handleLobbyExpire,
  });

  const minTwoPlayers =
    typeof game?.config === 'object' &&
    game.config !== null &&
    !Array.isArray(game.config)
      ? (((game.config as Record<string, unknown>).minTwoPlayers as
          | boolean
          | undefined) ?? false)
      : false;

  const handleStartGame = async () => {
    // Client-side guards
    if (!currentPlayer?.is_host) return;
    if (minTwoPlayers && players.length < 2) {
      showError(
        'Not Enough Players',
        'This lobby requires at least 2 players to start.'
      );
      return;
    }

    const antiCheat =
      typeof game?.config === 'object' &&
      game.config !== null &&
      !Array.isArray(game.config)
        ? (((game.config as Record<string, unknown>).antiCheat as
            | boolean
            | undefined) ?? false)
        : false;

    const totalItems =
      (game as unknown as { sheet?: { items?: string[] } })?.sheet?.items
        ?.length || 25;

    let sharedItemIndices: number[] | null = null;
    if (antiCheat && totalItems > 24) {
      // Pick exactly 24 items to be shared universally among all players
      const fullPool = Array.from({ length: totalItems }, (_, i) => i);
      for (let i = fullPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullPool[i], fullPool[j]] = [fullPool[j], fullPool[i]];
      }
      sharedItemIndices = fullPool.slice(0, 24);
    }

    const generateShuffledLayout = (
      totalPoolCount: number,
      sharedPool: number[] | null
    ): number[] => {
      let selected: number[];
      if (sharedPool) {
        selected = [...sharedPool];
        for (let i = selected.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selected[i], selected[j]] = [selected[j], selected[i]];
        }
      } else {
        const pool = Array.from({ length: totalPoolCount }, (_, i) => i);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        selected = pool.slice(0, 24);
      }

      const layout = new Array(25).fill(-1);
      for (let i = 0; i < 25; i++) {
        if (i < 12) layout[i] = selected[i];
        else if (i > 12) layout[i] = selected[i - 1];
      }
      return layout;
    };

    try {
      // Assign board layouts in parallel
      await Promise.all(
        players.map((player) => {
          const layout = generateShuffledLayout(totalItems, sharedItemIndices);
          return updatePlayerBoard({
            playerId: player.id as Id<'player'>,
            boardLayout: layout,
          });
        })
      );

      await startGameMutation({ gameId });
      navigate(`/game/${gameId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Error starting game:', error);
      showError('Start Game Failed', errMsg || 'Failed to start the game.');
    }
  };

  const handleCopy = async () => {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.room_code);
      setCopiedMsg('Room Code Copied!');
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!game) return;
    const joinUrl = `${window.location.origin}/join?code=${game.room_code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Pingo game!',
          text: `Use code ${game.room_code} to join my Bingo lobby.`,
          url: joinUrl,
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedMsg('Invite Link Copied!');
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#E8F4F8] p-6 text-center font-display dark:bg-background-dark">
        {/* Background flair */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#d0eaf5_100%)] opacity-80 dark:bg-[radial-gradient(circle_at_50%_40%,_#221710_0%,_#110a06_100%)]" />
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="flex w-full max-w-xs flex-col items-center gap-6"
        >
          {/* Icon */}
          <div className="flex size-24 items-center justify-center rounded-3xl bg-red-100 shadow-lg dark:bg-red-900/30">
            <ShieldOff size={44} className="text-red-500" />
          </div>

          <div>
            <h2 className="mb-2 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Access Denied
            </h2>
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
              You haven&apos;t joined this lobby. Ask the host for the room code
              and join from the home screen.
            </p>
          </div>

          {/* Countdown hint */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Redirecting you home&hellip;
          </p>

          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full rounded-2xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all active:scale-95"
          >
            Go Home Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#E8F4F8] font-display antialiased dark:bg-background-dark">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      {/* Background Elements */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#d0eaf5_100%)] opacity-80 dark:bg-[radial-gradient(circle_at_50%_40%,_#221710_0%,_#110a06_100%)]" />
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <h2 className="rotate-[-10deg] select-none text-8xl font-black text-primary">
            BINGO
          </h2>
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-1/3 items-end justify-center gap-6 pb-6">
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/20 text-xl font-black text-primary/50">
            7
          </div>
          <div className="mb-4 flex size-20 items-center justify-center rounded-full border-2 border-yellow-400/30 bg-yellow-400/20 text-2xl font-black text-yellow-500/50">
            42
          </div>
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-green-400/30 bg-green-400/20 text-lg font-black text-green-500/50">
            15
          </div>
        </div>
        <Star className="absolute left-[10%] top-[15%] h-5 w-5 text-yellow-400 opacity-40" />
        <Star className="absolute right-[20%] top-[5%] h-6 w-6 text-yellow-400 opacity-40" />
        <Star className="absolute right-[5%] top-[25%] h-4 w-4 text-primary opacity-30" />
        <Star className="absolute left-[5%] top-[50%] h-5 w-5 text-blue-400 opacity-30" />
      </div>

      {/* Top App Bar */}
      <div className="relative z-10 flex items-center border-b border-slate-200 bg-white/50 p-4 backdrop-blur-sm dark:border-slate-800">
        <div className="mx-auto flex w-full max-w-md flex-1 items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 px-4 text-center">
            <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
              {game?.room_code || 'Lobby'}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Game ID: #{id?.toString().slice(0, 5)}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto pb-40">
        <div className="mx-auto w-full max-w-md">
          {/* Sharing Card */}
          <div className="p-4 pt-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="group relative overflow-hidden rounded-[2.5rem] border border-white/50 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            >
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Copy size={80} className="rotate-12" />
              </div>

              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Invite Friends
              </p>
              <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Ready to Play?
              </h2>

              <div className="flex items-stretch gap-3">
                <div
                  onClick={handleCopy}
                  className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 transition-colors hover:border-primary/50 dark:border-slate-800 dark:bg-background-dark"
                >
                  <span className="text-4xl font-black tracking-[0.3em] text-primary">
                    {game?.room_code}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase text-slate-400">
                    Click to Copy Code
                  </span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex aspect-square items-center justify-center rounded-2xl bg-primary px-4 text-white shadow-lg shadow-primary/20 transition-transform active:scale-95"
                >
                  <Share2 size={24} />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Player Status Summary */}
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="flex flex-col gap-1 rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-sm dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Players Joined
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                {players.length}/12
              </p>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border border-white/50 bg-white/40 p-4 backdrop-blur-sm dark:bg-slate-900/50">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Game Mode
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Classic
              </p>
            </div>
          </div>

          {/* Lobby Timeout Countdown */}
          <div className="px-4 pb-2">
            <motion.div
              animate={timeout.isUrgent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.6, repeat: Infinity }}
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                timeout.isUrgent
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  : 'border-white/50 bg-white/40 dark:border-slate-800 dark:bg-slate-900/50'
              )}
            >
              <Timer
                size={16}
                className={cn(
                  'shrink-0',
                  timeout.isUrgent
                    ? 'text-red-500'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              />
              <div className="flex-1">
                <p
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider',
                    timeout.isUrgent ? 'text-red-400' : 'text-slate-400'
                  )}
                >
                  {timeout.isUrgent
                    ? 'Lobby closing soon!'
                    : 'Lobby auto-closes in'}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-lg font-black tabular-nums leading-none',
                    timeout.isUrgent
                      ? 'text-red-500'
                      : 'text-slate-700 dark:text-slate-200'
                  )}
                >
                  {timeout.label}
                </p>
              </div>
              <p className="text-right text-[9px] font-medium text-slate-400">
                Closes if host
                <br />
                doesn&#39;t start
              </p>
            </motion.div>
          </div>

          {/* Player Grid */}
          <div className="px-4 py-2">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Lobby Participants
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <AnimatePresence>
                {players.map((player) => (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={player.id}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="relative">
                      <div
                        className={cn(
                          'size-14 rounded-full p-0.5',
                          player.is_host
                            ? 'border-2 border-primary'
                            : 'border border-slate-200 bg-white dark:border-slate-800'
                        )}
                      >
                        <img
                          alt={player.nickname}
                          className="h-full w-full rounded-full object-cover"
                          src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.nickname}`}
                        />
                      </div>
                      {player.is_host && (
                        <div className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-black uppercase text-white shadow-sm">
                          Host
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        'w-full truncate text-center text-[10px] font-bold',
                        player.is_host
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      )}
                    >
                      {player.nickname}
                    </span>
                  </motion.div>
                ))}
                {Array.from({ length: Math.max(0, 8 - players.length) }).map(
                  (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex flex-col items-center gap-2 opacity-50"
                    >
                      <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white/20 dark:border-slate-700">
                        <UserPlus size={20} className="text-slate-400" />
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        Waiting...
                      </span>
                    </div>
                  )
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Copy / Share Notification */}
      <AnimatePresence>
        {copiedMsg && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-32 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-2xl"
          >
            <CheckCircle className="text-green-500" size={16} />
            {copiedMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/80 p-4 pb-8 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto w-full max-w-md space-y-4">
          {currentPlayer?.is_host ? (
            <button
              onClick={handleStartGame}
              disabled={minTwoPlayers && players.length < 2}
              className="w-full cursor-pointer rounded-2xl bg-primary py-4 text-lg font-black uppercase tracking-widest text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none dark:disabled:bg-slate-700"
            >
              {minTwoPlayers && players.length < 2
                ? 'Waiting for players...'
                : 'Start Game'}
            </button>
          ) : (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 py-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block h-2 w-2 rounded-full bg-primary"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.18,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Waiting for host to start
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
