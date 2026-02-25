import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PopularSheets, { SeeAllLink } from '@/components/PopularSheets';

function useLivePlayerCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCount = async () => {
      // Supabase JS client doesn't support subquery builders in .in();
      // fetch active game IDs first, then count players in those games.
      const { data: games } = await supabase
        .from('game')
        .select('id')
        .in('status', ['lobby', 'active']);

      const gameIds = (games ?? []).map((g: { id: string }) => g.id);

      if (gameIds.length === 0) {
        if (!cancelled) setCount(0);
        return;
      }

      const { count: n } = await supabase
        .from('player')
        .select('id', { count: 'exact', head: true })
        .in('game_id', gameIds);

      if (!cancelled) setCount(n ?? 0);
    };

    fetchCount();

    const channel = supabase
      .channel('live-player-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'player' }, () => fetchCount())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'player' }, () => fetchCount())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game' }, () => fetchCount())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

function formatLiveCount(n: number | null): string {
  if (n === null) return '…';
  if (n >= 1000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return String(n);
}

export default function HomePage() {
  const navigate = useNavigate();
  const liveCount = useLivePlayerCount();
  const { user, profile } = useAuth();

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">casino</span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Pingo</span>
        </div>
        <button 
          onClick={() => navigate(user ? '/profile' : '/signin')}
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-primary border-opacity-20"
        >
          {user ? (
            profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
               <span>{(profile?.nickname || user.email || '?').charAt(0).toUpperCase()}</span>
            )
          ) : (
            <span className="material-symbols-outlined">person</span>
          )}
        </button>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-12 pb-16 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="absolute top-10 right-10 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary/40 rotate-12">
            <span className="material-symbols-outlined text-4xl">star</span>
          </div>
          <div className="absolute bottom-20 left-[-20px] w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary/30">
            <span className="material-symbols-outlined text-5xl">blur_on</span>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="material-symbols-outlined text-sm">local_fire_department</span>
              Live Now: {formatLiveCount(liveCount)} Players
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-6">
              The Ultimate <span className="text-primary">Multiplayer</span> Bingo Experience
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-10 leading-relaxed">
              Host your own room or join friends for a high-energy bingo night anytime, anywhere.
            </p>
            <div className="flex flex-col w-full gap-4">
              <Link
                to="/create"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 text-lg"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Host a Game
              </Link>
              <Link
                to="/join"
                className="w-full bg-white dark:bg-slate-800 border-2 border-primary/20 text-slate-900 dark:text-white font-bold py-4 rounded-full transition-all flex items-center justify-center gap-2 text-lg"
              >
                <span className="material-symbols-outlined">group_add</span>
                Join a Game
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-12">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-8 text-center">How it Works</h2>
          <div className="space-y-6">
            <StepCard icon="edit_square" title="Create" description="Choose your theme and grid size effortlessly." />
            <StepCard icon="share" title="Invite" description="Share a unique room code with your friends." />
            <StepCard icon="trophy" title="Play" description="Mark your numbers and claim your Bingo!" />
          </div>
        </section>

        {/* Popular Sheets Section */}
        <section className="px-6 py-12 bg-white dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Popular Sheets</h2>
            <SeeAllLink />
          </div>
          <PopularSheets />
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="sticky bottom-0 z-50 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 pb-safe">
        <div className="flex justify-around items-center px-2 py-3">
          <NavLink icon="house" label="Home" to="/" active />
          <NavLink icon="groups" label="Rooms" to="#" />
          <NavLink icon="grid_view" label="Sheets" to="/sheets" />
          <NavLink icon="account_circle" label="Profile" to={user ? '/profile' : '/signin'} />
        </div>
      </footer>

    </div>
  );
}

function StepCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl border border-primary/5">
      <div className="w-14 h-14 shrink-0 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-primary">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function NavLink({ icon, label, to, active }: { icon: string; label: string; to: string; active?: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-slate-400 hover:text-primary transition-colors'}`}
    >
      <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
