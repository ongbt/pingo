import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Game, Player, Sheet } from '@/types';
import { cn } from '@/lib/utils';
import { LogOut, Grid3X3, Star, PartyPopper, Volume2, Settings, Trophy, ShieldCheck, Eye, OctagonX, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { Id, Doc } from '../../convex/_generated/dataModel';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = id as Id<"game">;
  
  const gameResult = useQuery(api.games.getWithSheet, { gameId });
  const playersResult = useQuery(api.players.getForGame, { gameId });
  const updatePlayerBoard = useMutation(api.players.updateBoard);
  const claimBingoMutation = useMutation(api.players.claimBingo);
  const endMutation = useMutation(api.games.end);
  const leaveMutation = useMutation(api.players.leave);

  const [marked, setMarked] = useState<number[]>([]);
  const [isSpectating, setIsSpectating] = useState(false);
  const [isEndGameOpen, setIsEndGameOpen] = useState(false);
  const [lastMarked, setLastMarked] = useState<{ nickname: string, item: string } | null>(null);
  const [lastLeft, setLastLeft] = useState<string | null>(null);
  const [lastBingo, setLastBingo] = useState<{ nickname: string, rank: number } | null>(null);

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
        sheet: gameResult.sheet ? {
            id: gameResult.sheet._id,
            title: gameResult.sheet.title,
            items: gameResult.sheet.items,
            is_default: gameResult.sheet.isDefault,
            creator_id: gameResult.sheet.creatorId ?? null,
            play_count: gameResult.sheet.playCount,
            created_at: new Date(gameResult.sheet._creationTime).toISOString()
        } : undefined
    } as unknown as (Game & { sheet: Sheet });
  }, [gameResult]);

  const players = useMemo(() => {
    if (!playersResult) return [];
    return (playersResult as Doc<"player">[]).map(p => ({
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
        created_at: new Date(p._creationTime).toISOString()
    } as Player));
  }, [playersResult]);

  const currentPlayer = useMemo(() => {
    const savedPlayerId = localStorage.getItem(`pingo_player_${gameId}`);
    return (players as Player[]).find(p => p.id === savedPlayerId) ?? null;
  }, [players, gameId]);

  // Sync internal 'marked' state with DB on load
  const [hasSyncedMarked, setHasSyncedMarked] = useState(false);
  useEffect(() => {
    if (currentPlayer && !hasSyncedMarked) {
        setMarked(currentPlayer.board_state as number[] || []);
        setHasSyncedMarked(true);
    }
  }, [currentPlayer, hasSyncedMarked]);

  const loading = gameResult === undefined || playersResult === undefined;

  // Track changes for notifications
  const prevPlayersRef = useRef<Player[]>([]);
  useEffect(() => {
    if (!playersResult || !game) return;
    
    // Detect new winners
    players.forEach(p => {
        const oldP = prevPlayersRef.current.find(old => old.id === p.id);
        if (p.is_winner && (!oldP || !oldP.is_winner)) {
            setLastBingo({ nickname: p.nickname, rank: 1 }); // Rank logic simplified in Convex for now
            setTimeout(() => setLastBingo(null), 5000);
        }
        
        // Detect board state updates for toasts
        if (p.board_state && oldP?.board_state) {
            const newState = p.board_state as number[];
            const oldState = oldP.board_state as number[];
            if (newState.length > oldState.length) {
                const newIndex = newState.find(idx => !oldState.includes(idx));
                if (newIndex !== undefined) {
                    const layout = p.board_layout as number[] | null;
                    const itemIndex = layout ? layout[newIndex] : newIndex;
                    setLastMarked({ nickname: p.nickname, item: game.sheet.items[itemIndex] });
                    setTimeout(() => setLastMarked(null), 3000);
                }
            }
        }
    });

    // Detect departures
    prevPlayersRef.current.forEach(oldP => {
        if (!players.find(p => p.id === oldP.id)) {
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
      return layout.map(idx => game.sheet.items[idx]);
    }
    return game.sheet.items.slice(0, 25);
  }, [game, currentPlayer]);

  // 3. Bingo Logic
  const hasBingo = useMemo(() => {
    const wins = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Horizontal
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Vertical
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonal
    ];
    // Use a Set for O(1) lookups instead of O(n) Array.includes()
    const markedSet = new Set([...marked, 12]);
    return wins.some(line => line.every(idx => markedSet.has(idx)));
  }, [marked]);

  const playersLoadedRef = useRef(false);
  useEffect(() => {
    if (!loading) playersLoadedRef.current = true;
  }, [loading]);

  const isWritingRef = useRef(false);
  const toggleMark = async (index: number) => {
    if (index === 12 || !currentPlayer || !game || game.status === 'finished') return;
    if (isWritingRef.current) return;

    const newMarked = marked.includes(index)
      ? marked.filter(i => i !== index)
      : [...marked, index];

    setMarked(newMarked);
    // Convex update
    try {
        isWritingRef.current = true;
        await updatePlayerBoard({ 
            playerId: currentPlayer.id as Id<"player">, 
            boardState: newMarked 
        });
    } catch (e) {
        console.error("Failed to update board", e);
    } finally {
        isWritingRef.current = false;
    }
  };

  const handleBingo = async () => {
    if (!hasBingo || !currentPlayer || !game || currentPlayer.is_winner) return;
    try {
        await claimBingoMutation({ playerId: currentPlayer.id as Id<"player"> });
    } catch (e) {
        console.error("Failed to claim bingo", e);
    }
  };

  const handleEndGame = async () => {
    if (!game || !currentPlayer?.is_host) return;
    try {
        await endMutation({ gameId });
        setIsEndGameOpen(false);
    } catch (e) {
        console.error("Failed to end game", e);
    }
  };

  const handleQuit = async () => {
    if (!currentPlayer) {
      navigate('/');
      return;
    }
    if (currentPlayer.is_host) return;

    try {
        await leaveMutation({ playerId: currentPlayer.id as Id<"player"> });
        localStorage.removeItem(`pingo_player_${gameId}`);
        navigate('/');
    } catch (e) {
        console.error("Failed to leave game", e);
    }
  };

  const winner = useMemo(() => {
    return players.find(p => p.is_winner) || null;
  }, [players]);

  useEffect(() => {
    if (!winner) return;
    let active = true;
    const end = Date.now() + 3 * 1000;
    const colors = ['#f47b25', '#fcd34d', '#22c55e', '#3b82f6'];

    (function frame() {
      if (!active) return;
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());

    return () => { active = false; };
  }, [winner]);

  const sortedPlayers = useMemo(() => {
    const pList = [...players] as Player[];
    return pList.sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

  // Enforce minTwoPlayers during gameplay
  useEffect(() => {
    if (!playersLoadedRef.current || !game || game.status !== 'active') return;

    const minTwoPlayers =
      typeof game.config === 'object' && game.config !== null && !Array.isArray(game.config)
        ? (game.config as Record<string, unknown>).minTwoPlayers as boolean | undefined ?? false
        : false;

    if (minTwoPlayers && players.length < 2) {
      endMutation({ gameId }).catch(e => console.error("Failed to end game on drop", e));
    }
  }, [game, players.length, gameId, endMutation]);

  // Game session timeout
  const gameTimeoutMin =
    typeof game?.config === 'object' && game.config !== null && !Array.isArray(game.config)
      ? (game.config as Record<string, unknown>).game_timeout_min as number | undefined ?? 30
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
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col relative overflow-x-hidden antialiased">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#e0f2fe] dark:bg-slate-900">
          <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, #bae6fd 15deg 30deg)' }} />
        </div>
        {/* Bingo Balls */}
        <div className="absolute -bottom-16 -left-16 w-64 h-64 opacity-60">
          <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-[#fcd34d] border-4 border-white/50 flex items-center justify-center text-4xl font-black text-white/80">30</div>
          <div className="absolute bottom-24 left-24 w-24 h-24 rounded-full bg-[#f47b25] border-4 border-white/50 flex items-center justify-center text-2xl font-black text-white/80">9</div>
        </div>
        <div className="absolute top-20 left-10 text-[#fef08a] opacity-80 animate-bounce">
          <Star size={40} fill="currentColor" />
        </div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-20 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <Grid3X3 className="text-primary" />
          <h1 className="text-xl font-black tracking-tight uppercase truncate max-w-[150px]">
            {game.sheet.title}
          </h1>
        </div>
        {/* Game timeout pill - only shown when <= 10 mins remaining */}
        <AnimatePresence>
          {game.status !== 'finished' && gameTimeout.secondsLeft !== null && gameTimeout.secondsLeft <= 600 && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={gameTimeout.isUrgent ? { scale: [1, 1.05, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, repeat: gameTimeout.isUrgent ? Infinity : 0 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm",
                gameTimeout.isUrgent
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/50"
              )}
              title="Game auto-ends due to inactivity"
            >
              <Timer size={12} className={cn(gameTimeout.isUrgent && "animate-pulse")} />
              <span>Idle: <span className="tabular-nums">{gameTimeout.label}</span></span>
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={handleQuit}
          disabled={currentPlayer?.is_host}
          title={currentPlayer?.is_host ? 'Use End Game to stop the session' : 'Quit game'}
          className="flex items-center gap-1 px-4 py-2 bg-primary/10 text-primary rounded-full font-black text-xs hover:bg-primary/20 transition-colors uppercase tracking-widest disabled:opacity-30 disabled:pointer-events-none"
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
                "flex flex-col items-center gap-1",
                i === 0 ? "scale-110 -order-1" : i === 1 ? "order-first mt-4" : "order-last mt-4"
              )}
            >
              <div className="relative">
                {i === 0 && <Trophy className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary fill-primary" size={24} />}
                <img 
                  alt={p.nickname} 
                  className={cn(
                    "rounded-full object-cover shadow-lg",
                    i === 0 ? "size-16 border-4 border-primary" : "size-12 border-2 border-white dark:border-slate-800"
                  )} 
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${p.nickname}`}
                />
                <div className={cn(
                  "absolute -bottom-1 -right-1 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-md",
                  i === 0 ? "bg-primary" : i === 1 ? "bg-slate-400" : "bg-amber-700"
                )}>
                  {i + 1}
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-tighter truncate w-16 text-center">{p.nickname}</p>
              <p className={cn(
                "text-[9px] font-bold uppercase",
                i === 0 ? "text-primary" : "text-slate-500"
              )}>{p.score || 0} pts</p>
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
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 border border-primary/20 rounded-full px-6 py-2 flex items-center gap-3 shadow-xl backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                <span className="text-primary">{lastMarked.nickname}</span> marked <span className="text-slate-900 dark:text-white underline decoration-primary/30 decoration-2 italic">&quot;{lastMarked.item}&quot;</span>
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
            className="fixed top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-white/95 dark:bg-slate-800/95 border border-red-200 dark:border-red-900/40 rounded-full px-6 py-2 flex items-center gap-3 shadow-xl backdrop-blur-sm">
              <LogOut size={12} className="text-red-400 shrink-0" />
              <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                <span className="text-red-400">{lastLeft}</span> has left the game
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
            className="fixed top-48 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl backdrop-blur-sm">
              <PartyPopper size={20} className="text-white shrink-0 animate-bounce" />
              <p className="text-sm font-black text-white uppercase tracking-tight">
                {lastBingo.nickname} got Bingo!
                <span className="ml-2 text-yellow-100 italic">
                  (#{lastBingo.rank})
                </span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bingo Grid */}
      <main className="px-4 pb-32 max-w-md mx-auto w-full flex-grow">
        <div className="grid grid-cols-5 gap-2.5 sm:gap-4 p-4 rounded-[2.5rem] bg-white/30 dark:bg-white/5 backdrop-blur-sm shadow-inner border border-white/20">
          {boardItems.map((item, i) => {
            const isCenter = i === 12;
            const isMarked = marked.includes(i) || isCenter;

            return (
              <button
                key={i}
                disabled={isCenter}
                onClick={() => toggleMark(i)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center p-2 rounded-2xl text-[9px] font-black text-center uppercase leading-[1.1] transition-all duration-300 relative overflow-hidden active:scale-95 group",
                  isMarked 
                    ? "bg-primary text-white shadow-lg shadow-primary/30 border-b-4 border-primary-dark translate-y-[-2px] brightness-105" 
                    : "bg-white/80 dark:bg-slate-800/80 border-b-4 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200 hover:border-primary/50"
                )}
              >
                {isCenter ? (
                  <Star fill="white" className="w-6 h-6 animate-pulse" />
                ) : (
                  <>
                    <span className="z-10 relative drop-shadow-sm">{item}</span>
                    <div className={cn(
                      "absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity",
                      isMarked && "opacity-0"
                    )} />
                  </>
                )}
                {isMarked && !isCenter && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 bg-white/20 flex items-center justify-center pointer-events-none"
                  >
                    <Star className="w-8 h-8 text-white/30 fill-white/10" />
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
            className="fixed bottom-0 left-0 right-0 p-8 flex flex-col items-center z-50 bg-gradient-to-t from-white dark:from-background-dark via-white/80 dark:via-background-dark/80 to-transparent pointer-events-none"
          >
            <button 
              onClick={handleBingo}
              disabled={game.status === 'finished'}
              className="group relative w-full max-w-xs h-20 bg-primary rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 text-white border-b-8 border-[#c65e18] active:border-b-0 active:translate-y-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none pointer-events-auto"
            >
              <PartyPopper size={36} className="animate-bounce" />
              <span className="text-4xl font-black tracking-tighter uppercase italic drop-shadow-md">Bingo!</span>
              <PartyPopper size={36} className="animate-bounce" />
              {/* Particle Burst Mockup */}
              <div className="absolute -top-10 left-0 w-full h-full pointer-events-none">
                 <Star className="absolute top-0 left-1/4 text-primary animate-ping w-4 h-4" />
                 <Star className="absolute top-4 right-1/4 text-yellow-400 animate-ping w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tools */}
      <nav className="fixed bottom-6 right-6 flex flex-col gap-4 z-40">
        <button className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xl border border-white/50 dark:border-slate-700/50 backdrop-blur-sm active:scale-95 transition-transform">
          <Volume2 size={24} />
        </button>
        <button className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-xl border border-white/50 dark:border-slate-700/50 backdrop-blur-sm active:scale-95 transition-transform">
          <Settings size={24} />
        </button>
      </nav>

      {/* GAME OVER OVERLAY (Host Force-Ended — No Winner) */}
      <AnimatePresence>
        {!winner && game.status === 'finished' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="flex flex-col items-center max-w-sm w-full"
            >
              <div className="size-24 rounded-3xl bg-slate-700/60 flex items-center justify-center mb-8 shadow-xl">
                <OctagonX size={48} className="text-red-400" />
              </div>

              <h2 className="text-white text-4xl font-black uppercase italic tracking-tighter mb-2 drop-shadow-lg">
                Game Over
              </h2>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10">
                {((game.config as Record<string, unknown>)?.minTwoPlayers && players.length < 2) 
                  ? "Not enough players to continue" 
                  : "The host ended the game"}
              </p>

              <div className="bg-white/10 rounded-3xl p-5 w-full backdrop-blur-md border border-white/10 mb-8">
                <p className="text-slate-300 text-xs font-black uppercase tracking-widest mb-3">Final Standings</p>
                <div className="flex flex-col gap-2">
                  {sortedPlayers.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs font-black w-4">#{i + 1}</span>
                      <img
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${p.nickname}`}
                        alt={p.nickname}
                        className="size-7 rounded-full border border-white/20"
                      />
                      <span className="text-white text-xs font-bold flex-1 text-left truncate">{p.nickname}</span>
                      <span className="text-slate-400 text-xs font-black">{p.score || 0} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/')}
                className="w-full h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 border-b-4 border-primary-dark active:border-b-0 active:translate-y-1 transition-all"
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
            className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative flex flex-col items-center max-w-sm w-full"
            >
              <div className="relative mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-40px] opacity-30"
                >
                  <Star fill="#f47b25" size={200} className="w-full h-full text-primary" />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="size-40 rounded-full border-8 border-primary shadow-2xl relative z-10 overflow-hidden"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${winner.nickname}`}
                    alt={winner.nickname}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="absolute -top-6 -right-6 bg-yellow-400 p-3 rounded-2xl shadow-lg rotate-12 z-20">
                  <Trophy size={32} className="text-white fill-white" />
                </div>
              </div>

              <h2 className="text-white text-5xl font-black uppercase italic tracking-tighter mb-2 drop-shadow-lg">
                Bingo!
              </h2>
              <p className="text-primary text-2xl font-black uppercase tracking-widest mb-8">
                {winner.nickname} Won!
              </p>

              <div className="bg-white/10 rounded-3xl p-6 w-full backdrop-blur-md border border-white/20 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Board Marks</span>
                  <span className="text-white font-black text-xl">{winner.score}</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(winner.score / 25) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => navigate('/')}
                  className="h-16 bg-primary text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 border-b-4 border-primary-dark active:border-b-0 active:translate-y-1 transition-all"
                >
                  Play Again
                </button>
                {!(game.config as { firstBingoWins?: boolean })?.firstBingoWins && (
                  <button 
                    onClick={() => setIsSpectating(true)}
                    className="h-16 bg-white/10 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center gap-2"
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
        <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 items-start">
          <button
            id="end-game-btn"
            onClick={() => setIsEndGameOpen(true)}
            disabled={game.status === 'finished'}
            className="flex items-center gap-2 bg-red-600/90 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <OctagonX size={14} />
            End Game
          </button>
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
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
            className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center gap-6"
            >
              <div className="size-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <OctagonX size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black uppercase tracking-tight mb-1">End the Game?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This will immediately end the game for <span className="font-bold text-slate-700 dark:text-slate-200">all players</span>. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  id="end-game-cancel-btn"
                  onClick={() => setIsEndGameOpen(false)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="end-game-confirm-btn"
                  onClick={handleEndGame}
                  className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-sm uppercase tracking-widest transition-colors shadow-lg shadow-red-500/30"
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
          <div className="flex items-center gap-2 bg-primary/90 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
            <Eye size={14} />
            Spectating
          </div>
        </div>
      )}
    </div>
  );
}
