import { apiFetch } from '../../lib/api.ts';
import type { User } from '../../types/api.ts';

interface UserResponse {
  user: User;
}

export const authApi = {
  me: () => apiFetch<UserResponse>('/auth/me').then((r) => r.user),
  login: (email: string, password: string) =>
    apiFetch<UserResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((r) => r.user),
  register: (email: string, password: string) =>
    apiFetch<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((r) => r.user),
  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),
};

/** Google sign-in is a full-page redirect through the backend, not an XHR. */
export function startGoogleLogin(): void {
  window.location.assign('/auth/google');
}
