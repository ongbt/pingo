import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useConvex } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import { ArrowLeft, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, isAuthenticated } = usePingoAuth();
  const { signIn } = useAuthActions();
  const convex = useConvex();
  const joinGame = useMutation(api.players.join);

  const [code, setCode] = useState(() => {
    const param = searchParams.get('code') ?? '';
    return param.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  });
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname);
      localStorage.setItem('pingo_nickname', profile.nickname);
    } else {
      const saved = localStorage.getItem('pingo_nickname');
      if (saved) setNickname(saved);
    }
  }, [profile]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(val);
    setError('');
  };

  const canJoin = code.length === 6 && nickname.trim().length > 0;

  const handleJoin = async () => {
    if (!canJoin || isJoining) return;
    setIsJoining(true);
    setError('');

    try {
      const game = await convex.query(api.games.getByCode, { roomCode: code });

      if (!game) {
        setError('Game not found. Double-check the code.');
        return;
      }
      if (game.status !== 'lobby') {
        setError('This game has already started or ended.');
        return;
      }

      if (!isAuthenticated) {
        await signIn("anonymous");
        // Re-check profile after sign-in? Convex Auth hooks will update state.
        // But for this mutation, we might need the new ID.
        // Actually, the mutation will pick up the new user ID from ctx automatically.
      }

      const playerId = await joinGame({
        gameId: game._id,
        nickname: nickname.trim(),
        isHost: false
      });

      localStorage.setItem('pingo_nickname', nickname.trim());
      localStorage.setItem(`pingo_player_${game._id}`, playerId);
      navigate(`/lobby/${game._id}`);
    } catch (err) {
      console.error('Error joining game:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'Failed to join game.');
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
          onClick={() => navigate(-1)}
          className="flex items-center justify-center size-10 rounded-full hover:bg-white/50 dark:hover:bg-primary/10 transition-colors bg-white/20"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase">Join Game</h1>
        <div className="size-10" />
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-10 pb-4 max-w-md mx-auto w-full relative z-10">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black tracking-tighter mb-3 uppercase">Enter &amp; Play</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
            Enter the room code and your nickname to join the bingo lobby.
          </p>
        </div>

        <div className="w-full space-y-5 mb-8">
          {/* Room Code */}
          <div className="space-y-2">
            <label 
              htmlFor="room-code"
              className="text-xs font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 pl-1"
            >
              Room Code
            </label>
            <div className="relative group">
              <input
                id="room-code"
                autoFocus
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="XXXXXX"
                className="w-full bg-white/50 dark:bg-white/5 border-2 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all rounded-[2rem] py-6 text-center text-4xl font-black tracking-[0.4em] uppercase placeholder:text-slate-200 dark:placeholder:text-slate-700 text-primary"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-50 group-focus-within:opacity-100 transition-opacity">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn('h-1 w-4 rounded-full', i < code.length ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700')} />
                ))}
              </div>
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-2 pt-4">
            <label 
              htmlFor="nickname"
              className="text-xs font-black tracking-widest uppercase text-slate-500 dark:text-slate-400 pl-1"
            >
              Your Nickname
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="w-full px-6 py-5 rounded-3xl bg-white/50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-black text-xl shadow-inner"
              placeholder="e.g. BingoKing"
              type="text"
              maxLength={24}
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-semibold text-center mb-4 -mt-2 px-4">
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={!canJoin || isJoining}
          className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl text-lg tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all uppercase disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining...' : "Let's Play!"}
        </button>
      </main>

      <footer className="p-8 flex justify-center">
        <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </footer>
    </div>
  );
}
