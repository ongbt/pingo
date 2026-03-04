import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react'; 
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import PopularSheets, { SeeAllLink } from '@/components/PopularSheets';

function useLivePlayerCount() {
  const stats = useQuery(api.games.getLiveStats);
  return stats?.totalPlayers ?? null;
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
    <div className="flex min-h-screen flex-col bg-background-light font-display text-slate-900 dark:bg-background-dark dark:text-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 px-4 py-3 backdrop-blur-md dark:bg-background-dark/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center rounded-full bg-primary p-1.5">
            <span className="material-symbols-outlined text-xl text-white">
              casino
            </span>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pingo
          </span>
        </div>
        <button
          onClick={() => navigate(user ? '/profile' : '/signin')}
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary border-opacity-20 bg-primary/10 font-bold text-primary"
        >
          {user ? (
            profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {(profile?.nickname || user.email || '?')
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )
          ) : (
            <span className="material-symbols-outlined">person</span>
          )}
        </button>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent px-6 pb-16 pt-12">
          <div className="absolute right-10 top-10 flex h-16 w-16 rotate-12 items-center justify-center rounded-full bg-primary/20 text-primary/40">
            <span className="material-symbols-outlined text-4xl">star</span>
          </div>
          <div className="absolute bottom-20 left-[-20px] flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary/30">
            <span className="material-symbols-outlined text-5xl">blur_on</span>
          </div>

          <div className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">
                local_fire_department
              </span>
              Live Now: {formatLiveCount(liveCount)} Players
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-white">
              The Ultimate <span className="text-primary">Multiplayer</span>{' '}
              Bingo Experience
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Host your own room or join friends for a high-energy bingo night
              anytime, anywhere.
            </p>
            <div className="flex w-full flex-col gap-4">
              <Link
                to="/create"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-lg font-bold text-white transition-all hover:bg-primary/90"
              >
                <span className="material-symbols-outlined">add_circle</span>
                Host a Game
              </Link>
              <Link
                to="/join"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-primary/20 bg-white py-4 text-lg font-bold text-slate-900 transition-all dark:bg-slate-800 dark:text-white"
              >
                <span className="material-symbols-outlined">group_add</span>
                Join a Game
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-12">
          <h2 className="mb-8 text-center text-2xl font-extrabold text-slate-900 dark:text-white">
            How it Works
          </h2>
          <div className="space-y-6">
            <StepCard
              icon="edit_square"
              title="Create"
              description="Choose your theme and grid size effortlessly."
            />
            <StepCard
              icon="share"
              title="Invite"
              description="Share a unique room code with your friends."
            />
            <StepCard
              icon="trophy"
              title="Play"
              description="Mark your numbers and claim your Bingo!"
            />
          </div>
        </section>

        {/* Popular Sheets Section */}
        <section className="bg-white px-6 py-12 dark:bg-slate-900/50">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Popular Sheets
            </h2>
            <SeeAllLink />
          </div>
          <PopularSheets />
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="pb-safe sticky bottom-0 z-50 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-background-dark">
        <div className="flex items-center justify-around px-2 py-3">
          <NavLink icon="house" label="Home" to="/" active />
          <NavLink icon="groups" label="Rooms" to="#" />
          <NavLink icon="grid_view" label="Sheets" to="/sheets" />
          <NavLink
            icon="account_circle"
            label="Profile"
            to={user ? '/profile' : '/signin'}
          />
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary/5 bg-white p-5 dark:bg-slate-800">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 text-primary dark:bg-orange-900/30">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function NavLink({
  icon,
  label,
  to,
  active,
}: {
  icon: string;
  label: string;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-slate-400 transition-colors hover:text-primary'}`}
    >
      <span className={`material-symbols-outlined ${active ? 'fill-1' : ''}`}>
        {icon}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-tighter">
        {label}
      </span>
    </Link>
  );
}
