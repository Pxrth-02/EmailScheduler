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

  // The backend sends the browser back here with ?error=google when the OAuth dance fails.
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
    <main className="flex min-h-full items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-[505px] rounded-xl border border-gray-200 bg-white px-14 py-14">
        <h1 className="mb-9 text-center text-[34px] font-bold tracking-tight text-gray-900">
          Login
        </h1>

        <button
          type="button"
          onClick={startGoogleLogin}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-brand-soft text-[15px] text-gray-900 transition-colors hover:bg-[#d8f0e1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <img
            src={GOOGLE_LOGO}
            alt=""
            className="size-[18px]"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          Login with Google
        </button>

        <div className="my-6 flex items-center gap-4 text-[13px] text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          or sign up through email
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            name="email"
            placeholder="Email ID"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            size="lg"
            loading={submit.isPending}
            className="mt-2 w-full rounded-lg"
          >
            {mode === 'login' ? 'Login' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[13px] text-gray-500">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-medium text-brand hover:underline"
          >
            {mode === 'login' ? 'Sign up with email' : 'Log in'}
          </button>
        </p>
      </div>
    </main>
  );
}
