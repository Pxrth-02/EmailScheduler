export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface ErrorBody {
  error?: string;
  details?: unknown;
}

/**
 * Thin fetch wrapper: JSON in, JSON out, cookies always sent, non-2xx turned into ApiError.
 * Paths are relative (`/api/...`): the dev server proxies them to the backend, and in
 * production the app is served from the same origin as the API.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const { error, details } = (body ?? {}) as ErrorBody;
    throw new ApiError(response.status, error ?? response.statusText, details);
  }

  return body as T;
}
