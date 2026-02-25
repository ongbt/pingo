import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ErrorDialog from '@/components/ErrorDialog';
import {
  ArrowLeft, User, LogOut, Save, Loader2, Link as LinkIcon, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, isLoading, signOut, refreshProfile } = useAuth();
  
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    // If auth state loaded and no user, kick them to login
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname);
    }
  }, [profile]);

  const showError = (title: string, message: string) => setDialog({ title, message });

  const handleSave = async () => {
    if (!nickname.trim()) {
      showError('Nickname Required', 'You must have a nickname to play.');
      return;
    }
    
    setSaving(true);
    const { error } = await supabase
      .from('profile')
      .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
      .eq('id', user?.id)

    setSaving(false);

    if (error) {
      showError('Update Failed', error.message);
    } else {
      await refreshProfile();
      localStorage.setItem('pingo_nickname', nickname.trim());
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading || !user) {
    return (
      <div className="bg-[#F5F7FA] dark:bg-background-dark min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen pb-36 font-display antialiased">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3.5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-black tracking-tight uppercase">My Profile</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        
        {/* Profile Card */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 to-orange-400/20" />
          
          <div className="relative pt-12 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 flex items-center justify-center text-3xl font-black text-primary uppercase shadow-md overflow-hidden relative group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.nickname?.charAt(0) || user.email?.charAt(0) || '?'
              )}
            </div>
            
            <p className="mt-3 text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {user.email}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1">
                Display Name (Nickname)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="Enter a nickname"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-sm transition-colors"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || nickname === profile?.nickname}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all",
                nickname !== profile?.nickname && nickname.trim() !== ''
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              )}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </section>

        {/* Action Links */}
        <section className="space-y-4">
          <Link
            to="/sheets"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <LogOut className="hidden" />
              <LinkIcon size={20} className="hidden" />
              <Edit3 size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">My Custom Sheets</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Manage the bingo sheets you've created.</p>
            </div>
          </Link>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 hover:border-red-500/30 transition-colors group"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <LogOut size={20} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-black text-sm text-red-500 dark:text-red-400">Sign Out</h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Log out of your account on this device.</p>
            </div>
          </button>
        </section>

      </main>
    </div>
  );
}
