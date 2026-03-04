import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useConvex } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
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
    return param
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
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
    const val = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
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
        await signIn('anonymous');
        // Re-check profile after sign-in? Convex Auth hooks will update state.
        // But for this mutation, we might need the new ID.
        // Actually, the mutation will pick up the new user ID from ctx automatically.
      }

      const playerId = await joinGame({
        gameId: game._id,
        nickname: nickname.trim(),
        isHost: false,
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
    <div className="flex min-h-screen flex-col overflow-hidden bg-background-light bg-gradient-to-b from-blue-50 to-white font-display text-slate-900 antialiased dark:bg-background-dark dark:from-slate-900 dark:to-background-dark dark:text-slate-100">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#87CEFA] opacity-30 dark:bg-[#1a3a5a]" />
        <div className="absolute left-1/2 top-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 opacity-20">
          <div
            className="h-full w-full"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, transparent 0deg 15deg, white 15deg 30deg)',
            }}
          />
        </div>
        <Star className="absolute right-10 top-20 h-10 w-10 text-yellow-400/40" />
        <Star className="absolute bottom-40 left-10 h-8 w-8 text-yellow-400/40" />
      </div>

      <header className="relative z-10 flex items-center justify-between bg-background-light/50 px-4 py-4 backdrop-blur-sm dark:bg-background-dark/50">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/50 dark:hover:bg-primary/10"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-black uppercase tracking-widest">
          Join Game
        </h1>
        <div className="size-10" />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pb-4 pt-10">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-4xl font-black uppercase tracking-tighter">
            Enter &amp; Play
          </h2>
          <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
            Enter the room code and your nickname to join the bingo lobby.
          </p>
        </div>

        <div className="mb-8 w-full space-y-5">
          {/* Room Code */}
          <div className="space-y-2">
            <label
              htmlFor="room-code"
              className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              Room Code
            </label>
            <div className="group relative">
              <input
                id="room-code"
                autoFocus
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="XXXXXX"
                className="w-full rounded-[2rem] border-2 border-transparent bg-white/50 py-6 text-center text-4xl font-black uppercase tracking-[0.4em] text-primary transition-all placeholder:text-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-white/5 dark:placeholder:text-slate-700"
              />
              <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-1 opacity-50 transition-opacity group-focus-within:opacity-100">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 w-4 rounded-full',
                      i < code.length
                        ? 'bg-primary'
                        : 'bg-slate-300 dark:bg-slate-700'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Nickname */}
          <div className="space-y-2 pt-4">
            <label
              htmlFor="nickname"
              className="pl-1 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400"
            >
              Your Nickname
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="w-full rounded-3xl border-2 border-transparent bg-white/50 px-6 py-5 text-xl font-black text-slate-900 shadow-inner transition-all placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 dark:bg-background-dark dark:text-slate-100"
              placeholder="e.g. BingoKing"
              type="text"
              maxLength={24}
            />
          </div>
        </div>

        {error && (
          <p className="-mt-2 mb-4 px-4 text-center text-sm font-semibold text-red-500">
            {error}
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={!canJoin || isJoining}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isJoining ? 'Joining...' : "Let's Play!"}
        </button>
      </main>

      <footer className="flex justify-center p-8">
        <div className="h-1.5 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
      </footer>
    </div>
  );
}
