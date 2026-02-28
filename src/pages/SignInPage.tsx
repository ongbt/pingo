import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthActions } from "@convex-dev/auth/react";
import ErrorDialog from '@/components/ErrorDialog';
import { ArrowLeft, Mail, Lock, LogIn, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const showError = (title: string, message: string) => setDialog({ title, message });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google");
    } catch (err) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      showError('Google Sign In Failed', errMsg);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Missing Fields', 'Please enter both email and password.');
      return;
    }
    
    setLoading(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      navigate('/');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showError('Sign In Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F5F7FA] dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen font-display antialiased flex flex-col items-center justify-center p-4">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center mb-10 pt-4">
          <h1 className="text-3xl font-black tracking-tight uppercase mt-2">Sign In</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">Welcome back to Pingo</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">or use email</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-sm transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-background-dark border-2 border-transparent focus:border-primary focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-bold text-sm transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 uppercase tracking-widest text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>
        </div>

        <p className="text-center text-sm font-medium text-slate-500 mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
