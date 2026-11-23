import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TokenResponse, User } from '../types/api';
import { storeSession, storedRefreshToken } from './api';
import { AuthProvider, homeFor, useAuth } from './auth';

const user: User = {
  id: 'u1',
  fullName: 'Ana Pérez',
  email: 'ana@empresa.com',
  role: 'INVESTOR',
  active: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-11-01T00:00:00Z',
};

const session = (n: number, u: User = user): TokenResponse => ({
  accessToken: `access-${n}`,
  tokenType: 'Bearer',
  expiresIn: 900,
  refreshToken: `refresh-${n}`,
  refreshTokenExpiresAt: '2026-12-01T00:00:00Z',
  user: u,
});

const json = (status: number, body: unknown) =>
  new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const fetchMock = vi.fn<typeof fetch>();
let ctx: ReturnType<typeof useAuth>;
const capture = (value: ReturnType<typeof useAuth>) => {
  ctx = value;
};

/** Expone el contexto a las pruebas y pinta su estado. */
function Probe() {
  const auth = useAuth();
  useEffect(() => capture(auth), [auth]);
  return (
    <p data-testid="state">
      {auth.status}:{auth.user?.fullName ?? '-'}
    </p>
  );
}

function renderProvider() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

const state = () => screen.getByTestId('state').textContent;

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  storeSession(null);
  vi.unstubAllGlobals();
});

describe('AuthProvider', () => {
  it('sin token guardado arranca sin sesión y sin llamar a la API', () => {
    renderProvider();
    expect(state()).toBe('anonymous:-');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('login guarda la sesión y expone al usuario', async () => {
    fetchMock.mockResolvedValueOnce(json(200, session(1)));
    renderProvider();
    await act(() => ctx.login('  ana@empresa.com ', 'secreta'));
    expect(state()).toBe('authenticated:Ana Pérez');
    expect(JSON.parse(String(fetchMock.mock.calls[0]![1]!.body))).toEqual({
      email: 'ana@empresa.com',
      password: 'secreta',
    });
    expect(ctx.hasRole('INVESTOR')).toBe(true);
    expect(ctx.hasRole('ADMIN')).toBe(false);
  });

  it('con un refresh token en memoria restaura la sesión al montar', async () => {
    storeSession(session(1));
    fetchMock.mockResolvedValueOnce(json(200, session(2)));
    renderProvider();
    expect(state()).toBe('loading:-');
    await waitFor(() => expect(state()).toBe('authenticated:Ana Pérez'));
    expect(String(fetchMock.mock.calls[0]![0])).toContain('/auth/refresh');
    expect(storedRefreshToken()).toBe('refresh-2');
  });

  it('logout revoca el refresh token sin enviar Bearer y cierra la sesión', async () => {
    fetchMock.mockResolvedValueOnce(json(200, session(1))).mockResolvedValueOnce(json(204, null));
    renderProvider();
    await act(() => ctx.login('ana@empresa.com', 'secreta'));
    await act(() => ctx.logout());

    const [url, init] = fetchMock.mock.calls[1]!;
    expect(String(url)).toContain('/auth/logout');
    expect(new Headers(init!.headers).get('Authorization')).toBeNull();
    expect(JSON.parse(String(init!.body))).toEqual({ refreshToken: 'refresh-1' });
    expect(state()).toBe('anonymous:-');
  });

  it('cambiar la contraseña reemplaza la sesión', async () => {
    const temp = { ...user, mustChangePassword: true };
    fetchMock
      .mockResolvedValueOnce(json(200, session(1, temp)))
      .mockResolvedValueOnce(json(200, session(2)));
    renderProvider();
    await act(() => ctx.login('ana@empresa.com', 'temporal-123'));
    const updated = await act(() => ctx.changePassword('temporal-123', 'nueva-segura-1'));
    expect(updated.mustChangePassword).toBe(false);
    expect(storedRefreshToken()).toBe('refresh-2');
  });
});

describe('homeFor', () => {
  it('manda a cambiar la contraseña temporal o a la app', () => {
    expect(homeFor({ ...user, mustChangePassword: true })).toBe('/cambiar-contrasena');
    expect(homeFor(user)).toBe('/app');
  });
});
