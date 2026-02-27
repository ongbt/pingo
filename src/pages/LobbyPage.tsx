import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Game, Player } from '@/types';
import { cn } from '@/lib/utils';
import { Copy, Share2, ArrowLeft, UserPlus, Star, CheckCircle, ShieldOff, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/components/ErrorDialog';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => setDialog({ title, message });

  useEffect(() => {
    if (!id) return;
    const gameId = String(id);

    const fetchData = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('game')
        .select('*, sheet(*)')
        .eq('id', gameId)
        .single();

      // Check error first before inspecting status
      if (gameError) {
        console.error('Error fetching game:', gameError);
        return;
      }

      if (gameData?.status === 'active') {
        navigate(`/game/${gameId}`);
        return;
      }

      let resolvedGame = gameData;
      if (gameData?.status === 'finished') {
        await supabase
          .from('game')
          .update({ status: 'lobby' })
          .eq('id', gameId);

        await supabase
          .from('player')
          .update({
            board_state: [],
            board_layout: null,
            score: 0,
            is_winner: false,
          })
          .eq('game_id', gameId);

        // Avoid mutating the read-only Supabase response object directly
        resolvedGame = { ...gameData, status: 'lobby' };
      }
      setGame(resolvedGame);

      const { data: playersData, error: playersError } = await supabase
        .from('player')
        .select('*')
        .eq('game_id', gameId);

      if (playersError) {
        console.error('Error fetching players:', playersError);
        return;
      }

      const pList = playersData || [];
      setPlayers(pList);

      // Identify the current player only from the persisted session ID.
      // If there's no localStorage entry (or the ID is stale/unknown) the
      // visitor has no business being in this lobby — block them.
      const savedPlayerId = localStorage.getItem(`pingo_player_${gameId}`);
      const found = savedPlayerId ? pList.find(p => p.id === savedPlayerId) ?? null : null;

      if (!found) {
        setIsUnauthorized(true);
        setLoading(false);
        return;
      }

      setCurrentPlayer(found);
      setLoading(false);
    };

    fetchData();

    const gameChannel = supabase
      .channel(`game_status:${gameId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game', filter: `id=eq.${gameId}` },
        (payload) => {
          if (payload.new.status === 'active') {
            navigate(`/game/${gameId}`);
          } else if (payload.new.status === 'finished') {
            // Server-side expiry (e.g., via expire_stale_sessions RPC) — go home
            navigate('/', { replace: true });
          } else {
            // Sync last_activity_at so the countdown stays accurate
            setGame((prev) => prev ? { ...prev, last_activity_at: payload.new.last_activity_at as string } : prev);
          }
        }
      )
      .subscribe();

    const channel = supabase
      .channel(`lobby_players:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'player', filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => {
              // Guard against the channel replaying an INSERT that the initial
              // fetch already captured (common on first subscribe).
              if (prev.some(p => p.id === (payload.new as Player).id)) return prev;
              return [...prev, payload.new as Player];
            });
          } else if (payload.eventType === 'DELETE') {
            setPlayers((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) => (p.id === payload.new.id ? (payload.new as Player) : p))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // navigate from React Router v6 is referentially stable — omitting intentionally

  // Read configurable thresholds from game.config (defaults: 15 min lobby, 30 min game)
  const lobbyTimeoutMin =
    typeof game?.config === 'object' && game.config !== null && !Array.isArray(game.config)
      ? (game.config as Record<string, unknown>).lobby_timeout_min as number | undefined ?? 15
      : 15;

  const handleLobbyExpire = useCallback(() => {
    navigate('/', { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timeout = useSessionTimeout({
    lastActivityAt: game?.last_activity_at,
    timeoutMinutes: lobbyTimeoutMin,
    onExpire: handleLobbyExpire,
  });

  const minTwoPlayers =
    typeof game?.config === 'object' && game.config !== null && !Array.isArray(game.config)
      ? (game.config as Record<string, unknown>).minTwoPlayers as boolean | undefined ?? false
      : false;

  const handleStartGame = async () => {
    // Client-side guards
    if (!currentPlayer?.is_host) return;
    if (minTwoPlayers && players.length < 2) {
      showError('Not Enough Players', 'This lobby requires at least 2 players to start.');
      return;
    }

    const gameId = String(id);

    const antiCheat =
      typeof game?.config === 'object' && game.config !== null && !Array.isArray(game.config)
        ? (game.config as Record<string, unknown>).antiCheat as boolean | undefined ?? false
        : false;

    const totalItems = (game as unknown as { sheet?: { items?: string[] } })?.sheet?.items?.length || 25;

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

    const generateShuffledLayout = (totalPoolCount: number, sharedPool: number[] | null): number[] => {
      let selected: number[];
      if (sharedPool) {
        // If anti-cheat is on, randomly shuffle the *exact same 24 items* for this player
        selected = [...sharedPool];
        for (let i = selected.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [selected[i], selected[j]] = [selected[j], selected[i]];
        }
      } else {
        // Otherwise, fully randomize their card from the entire possible pool of items
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

    // Assign board layouts in parallel — avoids N+1 sequential DB round-trips
    const layoutResults = await Promise.all(
      players.map((player) => {
        const layout = generateShuffledLayout(totalItems, sharedItemIndices);
        return supabase.from('player').update({ board_layout: layout }).eq('id', player.id);
      })
    );
    const failedLayout = layoutResults.find((r) => r.error);
    if (failedLayout) {
      console.error('Error assigning layout to a player:', failedLayout.error);
      showError('Board Layout Error', 'Failed to assign board layouts. Please try again.');
      return;
    }

    // Use the start_game RPC so that host verification is enforced
    // server-side — a non-host visitor who directly calls the Supabase
    // API cannot start the game even if they know the game ID.
    const { error } = await supabase.rpc('start_game', {
      p_game_id: gameId,
      p_player_id: currentPlayer.id,
    });

    if (error) {
      console.error('Error starting game:', error);
      showError('Start Game Failed', 'Failed to start the game. Please try again.');
      return;
    }

    navigate(`/game/${gameId}`);
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
      } catch (err) {
        // User cancelled share sheet — do nothing
        if ((err as Error).name === 'AbortError') return;
      }
    }
    // Fallback: copy the join URL to clipboard
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedMsg('Invite Link Copied!');
      setTimeout(() => setCopiedMsg(null), 2000);
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  // Auto-redirect unauthorized visitors back to home after a short delay
  useEffect(() => {
    if (!isUnauthorized) return;
    const t = setTimeout(() => navigate('/', { replace: true }), 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnauthorized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E8F4F8] dark:bg-background-dark font-display p-6 text-center">
        {/* Background flair */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#d0eaf5_100%)] dark:bg-[radial-gradient(circle_at_50%_40%,_#221710_0%,_#110a06_100%)] opacity-80" />
        </div>

        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="flex flex-col items-center gap-6 max-w-xs w-full"
        >
          {/* Icon */}
          <div className="size-24 rounded-3xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-lg">
            <ShieldOff size={44} className="text-red-500" />
          </div>

          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">
              Access Denied
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              You haven&apos;t joined this lobby. Ask the host for the room code and join from the home screen.
            </p>
          </div>

          {/* Countdown hint */}
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Redirecting you home&hellip;
          </p>

          <button
            onClick={() => navigate('/', { replace: true })}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl text-sm tracking-widest uppercase shadow-xl shadow-primary/30 active:scale-95 transition-all"
          >
            Go Home Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#E8F4F8] dark:bg-background-dark font-display antialiased">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_#ffffff_0%,_#d0eaf5_100%)] dark:bg-[radial-gradient(circle_at_50%_40%,_#221710_0%,_#110a06_100%)] opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <h2 className="text-8xl font-black text-primary rotate-[-10deg] select-none">BINGO</h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 flex items-end justify-center gap-6 pb-6 pointer-events-none">
          <div className="size-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-primary/50 font-black text-xl">7</div>
          <div className="size-20 rounded-full bg-yellow-400/20 border-2 border-yellow-400/30 flex items-center justify-center text-yellow-500/50 font-black text-2xl mb-4">42</div>
          <div className="size-14 rounded-full bg-green-400/20 border-2 border-green-400/30 flex items-center justify-center text-green-500/50 font-black text-lg">15</div>
        </div>
        <Star className="absolute top-[15%] left-[10%] text-yellow-400 opacity-40 w-5 h-5" />
        <Star className="absolute top-[5%] right-[20%] text-yellow-400 opacity-40 w-6 h-6" />
        <Star className="absolute top-[25%] right-[5%] text-primary opacity-30 w-4 h-4" />
        <Star className="absolute top-[50%] left-[5%] text-blue-400 opacity-30 w-5 h-5" />
      </div>

      {/* Top App Bar */}
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 relative z-10 bg-white/50 backdrop-blur-sm">
        <div className="flex-1 w-full max-w-md mx-auto flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full bg-white/80 dark:bg-slate-800 shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 px-4 text-center">
            <h1 className="text-slate-900 dark:text-slate-100 text-lg font-extrabold leading-tight tracking-tight truncate">
              {game?.room_code || 'Lobby'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Game ID: #{id?.toString().slice(0, 5)}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-40 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Sharing Card */}
          <div className="p-4 pt-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Copy size={80} className="rotate-12" />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Invite Friends</p>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Ready to Play?</h2>

            <div className="flex items-stretch gap-3">
              <div
                onClick={handleCopy}
                className="flex-1 bg-slate-50 dark:bg-background-dark rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <span className="text-4xl font-black tracking-[0.3em] text-primary">{game?.room_code}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Click to Copy Code</span>
              </div>
              <button
                onClick={handleShare}
                className="aspect-square bg-primary text-white rounded-2xl flex items-center justify-center px-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Share2 size={24} />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Player Status Summary */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-2xl p-4 border border-white/50 bg-white/40 dark:bg-slate-900/50 backdrop-blur-sm">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">Players Joined</p>
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-black">{players.length}/12</p>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl p-4 border border-white/50 bg-white/40 dark:bg-slate-900/50 backdrop-blur-sm">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">Game Mode</p>
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-black">Classic</p>
          </div>
        </div>

        {/* Lobby Timeout Countdown */}
        <div className="px-4 pb-2">
          <motion.div
            animate={timeout.isUrgent ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.6, repeat: Infinity }}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors",
              timeout.isUrgent
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-white/40 dark:bg-slate-900/50 border-white/50 dark:border-slate-800"
            )}
          >
            <Timer
              size={16}
              className={cn(
                "shrink-0",
                timeout.isUrgent ? "text-red-500" : "text-slate-400 dark:text-slate-500"
              )}
            />
            <div className="flex-1">
              <p className={cn(
                "text-[10px] font-black uppercase tracking-wider",
                timeout.isUrgent ? "text-red-400" : "text-slate-400"
              )}>
                {timeout.isUrgent ? "Lobby closing soon!" : "Lobby auto-closes in"}
              </p>
              <p className={cn(
                "text-lg font-black tabular-nums leading-none mt-0.5",
                timeout.isUrgent ? "text-red-500" : "text-slate-700 dark:text-slate-200"
              )}>
                {timeout.label}
              </p>
            </div>
            <p className="text-[9px] font-medium text-slate-400 text-right">
              Closes if host<br />doesn&#39;t start
            </p>
          </motion.div>
        </div>

        {/* Player Grid */}
        <div className="px-4 py-2">
          <h3 className="text-slate-900 dark:text-slate-100 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
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
                    <div className={cn(
                      "size-14 rounded-full p-0.5",
                      player.is_host ? "border-2 border-primary" : "border border-slate-200 dark:border-slate-800 bg-white"
                    )}>
                      <img
                        alt={player.nickname}
                        className="w-full h-full rounded-full object-cover"
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.nickname}`}
                      />
                    </div>
                    {player.is_host && (
                      <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase shadow-sm">
                        Host
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold truncate w-full text-center",
                    player.is_host ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                  )}>
                    {player.nickname}
                  </span>
                </motion.div>
              ))}
              {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center gap-2 opacity-50">
                  <div className="size-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white/20">
                    <UserPlus size={20} className="text-slate-400" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">Waiting...</span>
                </div>
              ))}
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
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-2 whitespace-nowrap"
          >
            <CheckCircle className="text-green-500" size={16} />
            {copiedMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-background-dark/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-8 z-20">
        <div className="w-full max-w-md mx-auto space-y-4">
          {currentPlayer?.is_host ? (
            <button
              onClick={handleStartGame}
              disabled={minTwoPlayers && players.length < 2}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none text-white py-4 rounded-2xl font-black text-lg tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/30 uppercase cursor-pointer disabled:cursor-not-allowed"
            >
              {minTwoPlayers && players.length < 2 ? "Waiting for players..." : "Start Game"}
            </button>
          ) : (
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-3"
            >
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-2 h-2 rounded-full bg-primary"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
                  />
                ))}
              </div>
              <span className="text-slate-500 dark:text-slate-400 font-black text-sm tracking-widest uppercase">
                Waiting for host to start
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
