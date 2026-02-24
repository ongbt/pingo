'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Game, Player, Sheet } from '@/types';
import { cn } from '@/lib/utils';
import { ArrowLeft, LogOut, Grid3X3, Star, PartyPopper, Volume2, Settings, Trophy, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GamePage() {
  const { id } = useParams();
  const router = useRouter();
  const [game, setGame] = useState<(Game & { sheet: Sheet }) | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [marked, setMarked] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMarked, setLastMarked] = useState<{ nickname: string, item: string } | null>(null);

  // 1. Fetch Game and Players
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: gameData, error: gameError } = await supabase
        .from('game')
        .select('*, sheet(*)')
        .eq('id', id)
        .single();

      if (gameError) {
        console.error('Error fetching game:', gameError);
        return;
      }
      setGame(gameData as any);

      const { data: playersData } = await supabase
        .from('player')
        .select('*')
        .eq('game_id', id);

      const pList = playersData || [];
      setPlayers(pList);

      // Simple current player detection (last joined/created in this session)
      // In a real app, this would be from cookies/session
      const savedPlayerId = localStorage.getItem(`pingo_player_${id}`);
      if (savedPlayerId) {
        const p = pList.find(p => p.id === savedPlayerId);
        if (p) {
          setCurrentPlayer(p);
          setMarked(p.board_state as number[] || []);
        }
      }
      setLoading(false);
    };

    fetchData();

    // Subscriptions
    const playerChannel = supabase.channel(`players:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player', filter: `game_id=eq.${id}` }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Player;
          setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
          
          // Show "activity" toast
          if (updated.board_state) {
            const oldState = players.find(p => p.id === updated.id)?.board_state as number[] || [];
            const newState = updated.board_state as number[];
            if (newState.length > oldState.length) {
              const newIndex = newState.find(idx => !oldState.includes(idx));
              if (newIndex !== undefined && game) {
                setLastMarked({ nickname: updated.nickname, item: game.sheet.items[newIndex] });
                setTimeout(() => setLastMarked(null), 3000);
              }
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playerChannel);
    };
  }, [id]);

  // 2. Bingo Logic
  const hasBingo = useMemo(() => {
    const wins = [
      [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Horizontal
      [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Vertical
      [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonal
    ];
    // Center is 12 (Free Space) - always treated as marked
    const markedWithCenter = [...marked, 12];
    return wins.some(line => line.every(idx => markedWithCenter.includes(idx)));
  }, [marked]);

  const toggleMark = async (index: number) => {
    if (index === 12 || !currentPlayer) return; // Can't toggle free space

    const newMarked = marked.includes(index)
      ? marked.filter(i => i !== index)
      : [...marked, index];
    
    setMarked(newMarked);

    // Update Supabase
    await supabase
      .from('player')
      .update({ board_state: newMarked, score: newMarked.length })
      .eq('id', currentPlayer.id);
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [players]);

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
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-1 px-4 py-2 bg-primary/10 text-primary rounded-full font-black text-xs hover:bg-primary/20 transition-colors uppercase tracking-widest"
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
                <span className="text-primary">{lastMarked.nickname}</span> marked <span className="text-slate-900 dark:text-white underline decoration-primary/30 decoration-2 italic">"{lastMarked.item}"</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bingo Grid */}
      <main className="px-4 pb-32 max-w-md mx-auto w-full flex-grow">
        <div className="grid grid-cols-5 gap-2.5 sm:gap-4 p-4 rounded-[2.5rem] bg-white/30 dark:bg-white/5 backdrop-blur-sm shadow-inner border border-white/20">
          {game.sheet.items.slice(0, 25).map((item, i) => {
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
        {hasBingo && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 p-8 flex flex-col items-center z-50 bg-gradient-to-t from-white dark:from-background-dark via-white/80 dark:via-background-dark/80 to-transparent"
          >
            <button 
              className="group relative w-full max-w-xs h-20 bg-primary rounded-[2rem] shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 text-white border-b-8 border-[#c65e18] active:border-b-0 active:translate-y-2 transition-all transform hover:scale-105"
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

      {/* Game Info Overlay (Host Only) */}
      {currentPlayer?.is_host && (
        <div className="fixed bottom-6 left-6 z-40">
          <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-2xl">
            <ShieldCheck size={14} className="text-green-500" />
            Host Mode
          </div>
        </div>
      )}
    </div>
  );
}
