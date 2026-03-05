import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import ErrorDialog from '@/components/ErrorDialog';
import { ArrowLeft, Mail, Lock, UserPlus, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);

  const showError = (title: string, message: string) =>
    setDialog({ title, message });

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signIn('google');
    } catch (err) {
      setLoading(false);
      const errMsg = err instanceof Error ? err.message : String(err);
      showError('Google Sign Up Failed', errMsg);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signUp' });
      setSuccess(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showError('Sign Up Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] p-4 font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Mail size={32} />
          </div>
          <h2 className="mb-2 text-2xl font-black tracking-tight">
            Check your email
          </h2>
          <p className="mb-8 text-sm font-medium text-slate-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account.
          </p>
          <Link
            to="/signin"
            className="inline-block rounded-xl bg-slate-100 px-6 py-3 font-bold text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F7FA] p-4 font-display text-slate-900 antialiased dark:bg-background-dark dark:text-slate-100">
      <ErrorDialog
        open={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        onClose={() => setDialog(null)}
      />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="mb-10 pt-4 text-center">
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight">
            Create Account
          </h1>
          <p className="mt-2 text-sm font-bold text-slate-500">
            Join Pingo to save your sheets
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            <GoogleIcon />
            <span>Sign up with Google</span>
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              or use email
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-slate-500"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border-2 border-transparent bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:bg-background-dark dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 ml-1 block text-[11px] font-black uppercase tracking-widest text-slate-500"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-transparent bg-slate-50 py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-0 dark:bg-background-dark dark:text-slate-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} />
              )}
              <span>{loading ? 'Creating account...' : 'Sign Up'}</span>
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Already have an account?{' '}
          <Link to="/signin" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
