import React, { useState, useEffect, useRef } from 'react';
import { LogIn, UserPlus, X, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFocusTrap } from '../hooks/useFocusTrap';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalInitialMode, login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(authModalInitialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useFocusTrap<HTMLDivElement>(isAuthModalOpen);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalInitialMode);
      setError(null);
      setEmail('');
      setPassword('');
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isAuthModalOpen, authModalInitialMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const domain = trimmedEmail.split('@')[1] || '';
    const labels = domain.split('.');
    if (
      !EMAIL_REGEX.test(trimmedEmail) ||
      labels.length < 2 ||
      labels.some((label) => label.length === 0) ||
      (labels[labels.length - 1]?.length ?? 0) < 2
    ) {
      setError('Please enter a valid email address (e.g. you@example.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-md p-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-soft-bg luxury-glass border border-white/40 dark:border-white/10 rounded-container shadow-extruded p-7 sm:p-9 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-soft-fg"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-6 right-6 h-9 w-9 flex items-center justify-center rounded-xl bg-soft-bg shadow-extruded-sm text-soft-muted hover:text-soft-fg hover:shadow-extruded active:shadow-inset-sm transition-all focus-visible:ring-2 focus-visible:ring-soft-accent outline-none"
          aria-label="Close authentication modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Tabs */}
        <div className="flex gap-2 p-1.5 bg-soft-bg shadow-inset-sm rounded-2xl mb-7 border border-white/20 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold font-display uppercase tracking-wider rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-soft-accent ${
              mode === 'login'
                ? 'bg-soft-bg text-soft-accent shadow-extruded-sm'
                : 'text-soft-muted hover:text-soft-fg'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold font-display uppercase tracking-wider rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-soft-accent ${
              mode === 'register'
                ? 'bg-soft-bg text-soft-accent shadow-extruded-sm'
                : 'text-soft-muted hover:text-soft-fg'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Register
          </button>
        </div>

        <div className="mb-6 text-center space-y-1.5">
          <h2 id="auth-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-soft-fg">
            {mode === 'login' ? 'Welcome Back' : 'Create Wardrobe'}
          </h2>
          <p className="text-xs sm:text-sm text-soft-muted font-body font-medium">
            {mode === 'login'
              ? 'Sign in to access your personal AI wardrobe catalog'
              : 'Start your personalized AI-powered digital closet'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 flex items-start gap-3 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-tight font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-soft-muted font-display">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-muted" />
              <input
                ref={emailInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-soft-bg shadow-inset-sm border border-white/20 dark:border-white/5 rounded-2xl text-sm font-medium text-soft-fg placeholder:text-soft-muted/50 focus:outline-none focus:ring-2 focus:ring-soft-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-soft-muted font-display">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-soft-bg shadow-inset-sm border border-white/20 dark:border-white/5 rounded-2xl text-sm font-medium text-soft-fg placeholder:text-soft-muted/50 focus:outline-none focus:ring-2 focus:ring-soft-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 bg-soft-accent hover:bg-soft-accent-light text-soft-accent-fg font-bold font-display uppercase tracking-widest text-[13px] rounded-2xl shadow-extruded hover:shadow-extruded-hover active:shadow-inset-sm active:translate-y-[0.5px] flex items-center justify-center gap-2.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-soft-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soft-bg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-soft-muted font-medium">
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-bold text-soft-accent hover:text-soft-accent-light hover:underline font-display transition-colors"
              >
                Sign up now
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-bold text-soft-accent hover:text-soft-accent-light hover:underline font-display transition-colors"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};
