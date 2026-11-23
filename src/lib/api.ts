import type { Problem, TokenResponse } from '../types/api';
import { ApiError } from './errors';

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const REFRESH_KEY = 'ritech-refresh';

/*
 * El access token vive solo en memoria. El refresh token se guarda en sessionStorage para
 * sobrevivir a una recarga de la pestaña; cada uno sirve una sola vez y se reemplaza al usarlo.
 */
let accessToken: string | null = null;
let refreshPromise: Promise<TokenResponse> | null = null;
let onSessionChange: ((session: TokenResponse | null) => void) | null = null;

export function setSessionListener(fn: typeof onSessionChange) {
  onSessionChange = fn;
}

export function storeSession(session: TokenResponse | null) {
  accessToken = session?.accessToken ?? null;
  try {
    if (session) sessionStorage.setItem(REFRESH_KEY, session.refreshToken);
    else sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    // Sin almacenamiento: la sesión se pierde al recargar, pero sigue funcionando.
  }
  onSessionChange?.(session);
}

export function storedRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

async function parseProblem(res: Response): Promise<Problem> {
  try {
    return (await res.json()) as Problem;
  } catch {
    return { status: res.status };
  }
}

async function send(path: string, init: RequestInit, auth: boolean): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (auth && accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR' });
  }
}

/** Renueva la sesión. Peticiones concurrentes comparten la misma renovación. */
export function refreshSession(): Promise<TokenResponse> {
  if (refreshPromise) return refreshPromise;
  const token = storedRefreshToken();
  if (!token) return Promise.reject(new ApiError(401, { code: 'INVALID_REFRESH_TOKEN' }));

  refreshPromise = (async () => {
    const res = await send('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: token }),
    }, false);
    if (!res.ok) {
      const problem = await parseProblem(res);
      // Solo un rechazo explícito cierra la sesión; un fallo de red la conserva.
      if (res.status === 401) storeSession(null);
      throw new ApiError(res.status, problem);
    }
    const session = (await res.json()) as TokenResponse;
    storeSession(session);
    return session;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  signal?: AbortSignal;
}

function buildPath(path: string, query?: RequestOptions['query']) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request(path: string, opts: RequestOptions = {}): Promise<Response> {
  const auth = opts.auth ?? true;
  const init: RequestInit = {
    method: opts.method ?? 'GET',
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  };
  const url = buildPath(path, opts.query);

  let res = await send(url, init, auth);
  if (auth && res.status === 401) {
    const problem = await parseProblem(res.clone());
    if (problem.code === 'TOKEN_EXPIRED' || !accessToken) {
      await refreshSession();
      res = await send(url, init, auth);
    }
  }
  if (!res.ok) throw new ApiError(res.status, await parseProblem(res));
  return res;
}

export async function api<T>(path: string, opts?: RequestOptions): Promise<T> {
  const res = await request(path, opts);
  if (res.status === 204 || res.headers.get('Content-Length') === '0') return undefined as T;
  return (await res.json()) as T;
}

/** Descarga un archivo autenticado (exportes CSV) con el nombre que sugiere el servidor. */
export async function download(path: string, query?: RequestOptions['query'], fallbackName = 'export.csv') {
  const res = await request(path, { query });
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
