import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { ApiError } from '../../lib/api.ts';
import { authApi, startGoogleLogin } from './api.ts';
import { meQueryKey, useMe } from './hooks.ts';

const GOOGLE_LOGO = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

export function LoginPage() {
  const me = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle OAuth failure redirect
  useEffect(() => {
    if (params.get('error') === 'google') {
      toast.error('Google sign-in did not complete. Please try again.');
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const submit = useMutation({
    mutationFn: () =>
      mode === 'login' ? authApi.login(email, password) : authApi.register(email, password),
    onSuccess: async (user) => {
      queryClient.setQueryData(meQueryKey, user);
      await navigate('/', { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError && error.status < 500
          ? error.message
          : 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });

  if (me.data) return <Navigate to="/" replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface p-space-md select-none">
      <div className="w-full max-w-[460px] rounded-2xl bg-surface-container-lowest border border-outline-variant/40 shadow-xl p-space-xl flex flex-col">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center gap-space-xs text-center mb-space-md">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 gap-[2.5px] p-1.5 rounded-lg bg-surface-container border border-outline-variant/60">
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-transparent"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
              <div className="w-1.5 h-1.5 bg-transparent"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-[0.5px]"></div>
            </div>
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              ONB
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono-metric bg-secondary-fixed text-on-secondary-fixed border border-secondary-fixed-dim/40 font-semibold">
              v2.4
            </span>
          </div>

          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight mt-2">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="font-body-base text-body-base text-on-surface-variant max-w-xs">
            {mode === 'login'
              ? 'Access your bulk outreach pipeline and scheduled email queues.'
              : 'Start orchestrating high-throughput outreach dispatches.'}
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={startGoogleLogin}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-label-md text-label-md text-on-surface transition-all hover:border-primary hover:bg-surface-container-low shadow-xs active:scale-[0.99] cursor-pointer"
        >
          <img
            src={GOOGLE_LOGO}
            alt=""
            className="size-5 shrink-0"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="my-space-md flex items-center gap-3 text-body-sm text-on-surface-variant/70">
          <span className="h-px flex-1 bg-outline-variant/30" />
          <span className="font-mono-metric text-[11px] uppercase tracking-wider">
            or continue with credentials
          </span>
          <span className="h-px flex-1 bg-outline-variant/30" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-space-sm">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Email Address
            </label>
            <Input
              type="email"
              name="email"
              look="filled"
              placeholder="name@company.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              Password
            </label>
            <Input
              type="password"
              name="password"
              look="filled"
              placeholder="••••••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submit.isPending}
            className="mt-space-sm w-full rounded-xl"
          >
            {mode === 'login' ? 'Sign In to Dashboard' : 'Complete Registration'}
          </Button>
        </form>

        {/* Switch Mode Footer */}
        <p className="mt-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
          {mode === 'login' ? "Don't have an account yet?" : 'Already registered?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-semibold text-primary hover:underline cursor-pointer ml-1"
          >
            {mode === 'login' ? 'Create one now' : 'Sign in instead'}
          </button>
        </p>
      </div>
    </main>
  );
}
