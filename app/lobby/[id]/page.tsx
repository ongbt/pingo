'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Game, Player } from '@/types';
import { cn } from '@/lib/utils';
import { Copy, ArrowLeft, Send, Smile, UserPlus, Star, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorDialog from '@/app/components/ErrorDialog';
import Image from 'next/image';

export default function LobbyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => setDialog({ title, message });

  useEffect(() => {
    if (!id) return;
    const gameId = String(id);

    const fetchData = async () => {
      // Fetch Game
      const { data: gameData, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('id', gameId)
        .single();

      if (gameData?.status === 'active') {
        router.push(`/game/${gameId}`);
        return;
      }

      // Reset finished games back to lobby state for replay
      if (gameData?.status === 'finished') {
        await supabase
          .from('game')
          .update({ status: 'lobby' })
          .eq('id', gameId);

        // Reset all player states for a fresh round
        await supabase
          .from('player')
          .update({
            board_state: [],
            board_layout: null,
            score: 0,
            is_winner: false,
          })
          .eq('game_id', gameId);

        gameData.status = 'lobby';
      }

      if (gameError) {
        console.error('Error fetching game:', gameError);
        return;
      }
      setGame(gameData);

      // Fetch Players
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

      // Detect current player
      const savedPlayerId = localStorage.getItem(`pingo_player_${gameId}`);
      if (savedPlayerId) {
        const found = pList.find(p => p.id === savedPlayerId) || null;
        setCurrentPlayer(found);
      } else {
        // Fallback: if there's only one player and we just created it, it might be us
        // Real logic should use session/cookies
        if (pList.length > 0) setCurrentPlayer(pList[pList.length - 1]);
      }

      setLoading(false);
    };

    fetchData();

    // 1. Subscription for Game Status changes (to auto-start for all players)
    const gameChannel = supabase
      .channel(`game_status:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.new.status === 'active') {
            router.push(`/game/${gameId}`);
          }
        }
      )
      .subscribe();

    // 2. Real-time subscription for players
    const channel = supabase
      .channel(`lobby_players:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player]);
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
  }, [id, router]);

  const handleStartGame = async () => {
    if (!currentPlayer?.is_host) {
      console.error('Cannot start game: current player is not host', { currentPlayer });
      return;
    }
    
    const gameId = String(id);

    // Generate a unique shuffled board layout for each player
    // Picks 24 items from the available pool and shuffles them into positions 0-11 and 13-24
    const generateShuffledLayout = (totalPoolCount: number): number[] => {
      // 1. Create a pool of all possible indices
      const pool = Array.from({ length: totalPoolCount }, (_, i) => i);
      
      // 2. Fisher-Yates shuffle the pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      
      // 3. Take 24 items for the visible squares
      const selected = pool.slice(0, 24);
      
      // 4. Map them to a 25-slot board array (skipping index 12)
      const layout = new Array(25).fill(-1);
      for (let i = 0; i < 25; i++) {
        if (i < 12) layout[i] = selected[i];
        else if (i > 12) layout[i] = selected[i - 1];
      }
      
      return layout;
    };

    // Assign a shuffled layout to each player
    const totalItems = (game as any)?.sheet?.items?.length || 25;
    
    for (const player of players) {
      const layout = generateShuffledLayout(totalItems);
      const { error: layoutError } = await supabase
        .from('player')
        .update({ board_layout: layout })
        .eq('id', player.id);

      if (layoutError) {
        console.error(`Error assigning layout to player ${player.nickname}:`, layoutError);
        showError('Board Layout Error', 'Failed to assign board layouts. Please try again.');
        return;
      }
    }

    // Set game to active
    const { error } = await supabase
      .from('game')
      .update({ status: 'active' })
      .eq('id', gameId);

    if (error) {
      console.error('Error starting game:', error);
      showError('Start Game Failed', 'Failed to start the game. Please try again.');
      return;
    }

    // Navigate host immediately (other players navigate via realtime subscription)
    router.push(`/game/${gameId}`);
  };

  const handleCopy = async () => {
    if (!game) return;
    
    try {
      await navigator.clipboard.writeText(game.room_code);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden max-w-md mx-auto bg-[#E8F4F8] dark:bg-background-dark font-display antialiased">
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
          <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-center relative">
            <Image 
              alt="Bingo balls background" 
              className="object-contain object-bottom opacity-40" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHv9x_gR86qD2q_z3_PAnY7hV7v8K_q7Bv9S8w" 
              fill
              sizes="100vw"
              unoptimized
            />
          </div>
        {/* Stars */}
        <Star className="absolute top-[15%] left-[10%] text-yellow-400 opacity-40 w-5 h-5" />
        <Star className="absolute top-[5%] right-[20%] text-yellow-400 opacity-40 w-6 h-6" />
        <Star className="absolute top-[25%] right-[5%] text-primary opacity-30 w-4 h-4" />
        <Star className="absolute middle-y left-[5%] text-blue-400 opacity-30 w-5 h-5" />
      </div>

      {/* Top App Bar */}
      <div className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 relative z-10 bg-white/50 backdrop-blur-sm">
        <button 
          onClick={() => router.back()}
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
        <button 
          onClick={handleCopy}
          className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 transition-transform"
        >
          <Copy size={20} />
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-40 relative z-10">
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
                onClick={handleCopy}
                className="aspect-square bg-primary text-white rounded-2xl flex items-center justify-center px-4 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <Copy size={24} />
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
                      <Image 
                        alt={player.nickname} 
                        className="w-full h-full rounded-full object-cover" 
                        src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${player.nickname}`}
                        width={56}
                        height={56}
                        unoptimized
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

        {/* Lobby Chat (Mock for now) */}
        <div className="p-4 mt-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-xs font-black uppercase tracking-widest mb-4">Lobby Chat</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Image 
                alt="Sarah" 
                className="size-8 rounded-full" 
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah"
                width={32}
                height={32}
                unoptimized
              />
              <div className="flex-1 bg-white/60 dark:bg-slate-800/80 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl backdrop-blur-sm border border-white/50 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-1">Sarah K.</p>
                <p className="text-xs text-slate-800 dark:text-slate-200 leading-normal">Is everyone ready to lose today? 😈</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="max-w-[80%] bg-primary/10 border border-primary/20 p-3 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl shadow-sm">
                <p className="text-xs text-slate-800 dark:text-slate-200">Just waiting for two more people!</p>
              </div>
              <Image 
                alt="Me" 
                className="size-8 rounded-full border-2 border-primary" 
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=Me"
                width={32}
                height={32}
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>

      {/* Copy Notification */}
      <AnimatePresence>
        {showCopied && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-2xl flex items-center gap-2"
          >
            <CheckCircle className="text-green-500" size={16} />
            Room Code Copied!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-background-dark/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 space-y-4 pb-8 z-20">
        {/* Chat Input */}
        <div className="flex gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 flex items-center">
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-500" 
              placeholder="Type a message..." 
              type="text"
            />
            <button className="text-slate-400">
              <Smile size={20} />
            </button>
          </div>
          <button className="size-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
            <Send size={18} />
          </button>
        </div>
        {/* Start Game Button (Host Only View) */}
        {currentPlayer?.is_host ? (
          <button 
            onClick={handleStartGame}
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl font-black text-lg tracking-widest active:scale-95 transition-all shadow-xl shadow-primary/30 uppercase"
          >
            Start Game
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
  );
}
