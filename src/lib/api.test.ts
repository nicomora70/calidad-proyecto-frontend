import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenResponse } from '../types/api';
import { api, setSessionListener, storeSession, storedRefreshToken } from './api';
import { ApiError } from './errors';

const user = {
  id: 'u1',
  fullName: 'Ana Pérez',
  email: 'ana@empresa.com',
  role: 'INVESTOR' as const,
  active: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-11-01T00:00:00Z',
};

const session = (n: number): TokenResponse => ({
  accessToken: `access-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: `refresh-${n}`,
  refreshTokenExpiresAt: '2026-12-01T00:00:00Z',
  user,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  storeSession(session(1));
});

afterEach(() => {
  fetchMock.mockReset();
  setSessionListener(null);
  storeSession(null);
  vi.unstubAllGlobals();
});

const authHeader = (call: number) =>
  new Headers(fetchMock.mock.calls[call]![1]!.headers).get('Authorization');

describe('api', () => {
  it('envía el access token como Bearer', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await expect(api('/api/me')).resolves.toEqual({ ok: true });
    expect(authHeader(0)).toBe('Bearer access-1');
  });

  it('ante TOKEN_EXPIRED renueva una vez y reintenta con el token nuevo', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { code: 'TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(json(200, session(2)))
      .mockResolvedValueOnce(json(200, { ok: true }));

    await expect(api('/api/me')).resolves.toEqual({ ok: true });
    expect(String(fetchMock.mock.calls[1]![0])).toContain('/api/auth/refresh');
    expect(authHeader(2)).toBe('Bearer access-2');
    expect(storedRefreshToken()).toBe('refresh-2');
  });

  it('peticiones concurrentes comparten una sola renovación', async () => {
    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith('/api/auth/refresh')) return json(200, session(2));
      const auth = new Headers(init?.headers).get('Authorization');
      return auth === 'Bearer access-2' ? json(200, { url }) : json(401, { code: 'TOKEN_EXPIRED' });
    });

    await Promise.all([api('/api/me'), api('/api/me/simulations')]);
    const refreshCalls = fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/api/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('si la renovación es rechazada, cierra la sesión', async () => {
    const listener = vi.fn();
    setSessionListener(listener);
    fetchMock
      .mockResolvedValueOnce(json(401, { code: 'TOKEN_EXPIRED' }))
      .mockResolvedValueOnce(json(401, { code: 'INVALID_REFRESH_TOKEN' }));

    await expect(api('/api/me')).rejects.toMatchObject({ code: 'INVALID_REFRESH_TOKEN' });
    expect(listener).toHaveBeenCalledWith(null);
    expect(storedRefreshToken()).toBeNull();
  });

  it('convierte errores RFC 7807 en ApiError con su código', async () => {
    fetchMock.mockResolvedValueOnce(json(400, { code: 'INSUFFICIENT_CAPITAL', detail: 'too low' }));
    const err = await api('/api/simulations', { method: 'POST', body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: 'INSUFFICIENT_CAPITAL' });
  });

  it('un fallo de red produce NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(api('/api/me')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
