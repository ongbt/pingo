'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ArrowLeft, Delete, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function JoinGamePage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [nickname, setNickname] = useState('');
  const [step, setStep] = useState<'code' | 'nickname'>('code');

  const handleNumberClick = (num: string) => {
    if (code.length < 5) {
      setCode([...code, num]);
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
  };

  const handleJoin = async () => {
    if (code.length < 5 || isJoining) return;
    setIsJoining(true);

    try {
      const roomCode = code.join('').toUpperCase();
      const { data: game, error: gameError } = await supabase
        .from('game')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (gameError || !game) {
        alert('Game not found. Please check the code.');
        setIsJoining(false);
        return;
      }

      setStep('nickname');
    } catch (error) {
      console.error('Error finding game:', error);
      alert('Error finding game.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCompleteJoin = async () => {
    if (!nickname.trim() || isJoining) return;
    setIsJoining(true);

    try {
      const roomCode = code.join('').toUpperCase();
      const { data: game } = await supabase
        .from('game')
        .select('id')
        .eq('room_code', roomCode)
        .single();

      if (!game) throw new Error('Game missing');

      const { data: newPlayer, error: playerError } = await supabase
        .from('player')
        .insert({
          game_id: game.id,
          nickname: nickname.trim(),
          is_host: false,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      // Save to localStorage
      localStorage.setItem(`pingo_player_${game.id}`, newPlayer.id);

      router.push(`/lobby/${game.id}`);
    } catch (error) {
      console.error('Error joining game:', error);
      alert('Failed to join. Nickname might be taken or game full.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-background-dark font-display antialiased overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#87CEFA] dark:bg-[#1a3a5a] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] opacity-20">
          <div className="w-full h-full" style={{ background: 'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg)' }} />
        </div>
        <Star className="absolute top-20 right-10 text-yellow-400/40 w-10 h-10" />
        <Star className="absolute bottom-40 left-10 text-yellow-400/40 w-8 h-8" />
      </div>

      <header className="flex items-center justify-between px-4 py-4 bg-background-light/50 dark:bg-background-dark/50 backdrop-blur-sm relative z-10">
        <button 
          onClick={() => step === 'nickname' ? setStep('code') : router.back()}
          className="flex items-center justify-center size-10 rounded-full hover:bg-white/50 dark:hover:bg-primary/10 transition-colors bg-white/20"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase">{step === 'code' ? 'Join Game' : 'Almost There'}</h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-4 max-w-md mx-auto w-full relative z-10">
        <AnimatePresence mode="wait">
          {step === 'code' ? (
            <motion.div 
              key="step-code"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">Enter Room Code</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  Ask the host for the 5-digit code to join the bingo lobby.
                </p>
              </div>

              {/* Code Input Display */}
              <div className="flex justify-between w-full gap-3 mb-12">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div 
                    key={i}
                    className={cn(
                      "size-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm",
                      code[i] 
                        ? "bg-primary/5 border-primary ring-4 ring-primary/10" 
                        : "bg-white/50 dark:bg-white/5 border-transparent"
                    )}
                  >
                    {code[i] ? (
                      <span className="text-2xl font-black text-primary uppercase">{code[i]}</span>
                    ) : (
                      <div className="size-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleJoin}
                disabled={code.length < 5 || isJoining}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl text-lg tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all mb-auto uppercase disabled:opacity-50"
              >
                {isJoining ? 'Checking...' : 'Enter Lobby'}
              </button>

              {/* Numeric/Alpha Keypad (Mocking for now, could be real buttons) */}
              <div className="w-full grid grid-cols-3 gap-4 mt-8">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '0'].map((n) => (
                  n === ' ' ? <div key="blank" /> : (
                    <button 
                      key={n}
                      onClick={() => handleNumberClick(n)}
                      className="h-16 flex items-center justify-center rounded-2xl bg-white/40 dark:bg-white/5 text-2xl font-black hover:bg-white dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm border border-white/50"
                    >
                      {n}
                    </button>
                  )
                ))}
                <button 
                  onClick={handleDelete}
                  className="h-16 flex items-center justify-center rounded-2xl bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all border border-primary/20"
                >
                  <Delete size={28} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="step-nickname"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black tracking-tighter mb-4 uppercase">What's your name?</h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                  Enter a nickname to show up in the lobby.
                </p>
              </div>

              <div className="w-full space-y-6 mb-12">
                <input 
                  autoFocus
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-6 py-5 rounded-3xl bg-white/50 dark:bg-background-dark border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-black text-xl shadow-inner" 
                  placeholder="e.g. BingoKing" 
                  type="text"
                />
              </div>

              <button 
                onClick={handleCompleteJoin}
                disabled={!nickname.trim() || isJoining}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl text-lg tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all uppercase disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Let\'s Play!'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 flex justify-center">
        <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </footer>
    </div>
  );
}
