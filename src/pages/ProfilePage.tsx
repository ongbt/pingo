import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { usePingoAuth } from '@/hooks/use-pingo-auth';
import ErrorDialog from '@/components/ErrorDialog';
import { ArrowLeft, User, LogOut, Save, Loader2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = usePingoAuth();
  const { signOut } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);

  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const isLoading = user === undefined;

  useEffect(() => {
    // If auth state loaded and no user, kick them to login
    if (!isLoading && !isAuthenticated) {
      navigate('/signin');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (profile?.nickname) {
      queueMicrotask(() => setNickname(profile.nickname));
    }
  }, [profile]);

  const showError = (title: string, message: string) =>
    setDialog({ title, message });

  const handleSave = async () => {
    if (!nickname.trim()) {
      showError('Nickname Required', 'You must have a nickname to play.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      localStorage.setItem('pingo_nickname', nickname.trim());
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showError('Update Failed', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] dark:bg-background-dark">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-36 font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-background-dark/90">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black uppercase tracking-tight">
            My Profile
          </h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-6 px-4 pt-6">
        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute left-0 top-0 h-24 w-full bg-gradient-to-br from-primary/20 to-orange-400/20" />

          <div className="relative flex flex-col items-center pt-12">
            <div className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-3xl font-black uppercase text-primary shadow-md dark:border-slate-800 dark:bg-slate-800">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                profile?.nickname?.charAt(0) || user.email?.charAt(0) || '?'
              )}
            </div>

            <p className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 dark:bg-slate-800">
              {user?.email || 'Anonymous Guest'}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="mb-2 ml-1 block text-[11px] font-black uppercase tracking-widest text-slate-500">
                Display Name (Nickname)
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || nickname === profile?.nickname}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all',
                nickname !== profile?.nickname && nickname.trim() !== ''
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800'
              )}
            >
              {saving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </section>

        {/* Action Links */}
        <section className="space-y-4">
          <Link
            to="/sheets"
            className="flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-primary/30 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
              <Edit3 size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                My Custom Sheets
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Manage the bingo sheets you've created.
              </p>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-red-500/30 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500/20">
              <LogOut size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-black text-red-500 dark:text-red-400">
                Sign Out
              </h3>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Log out of your account on this device.
              </p>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
