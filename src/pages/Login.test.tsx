import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/errors';
import { renderAt } from '../test/render';
import type { User } from '../types/api';
import Login from './Login';

const auth = vi.hoisted(() => ({
  status: 'anonymous' as const,
  user: null,
  login: vi.fn(),
}));

vi.mock('../lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/auth')>()),
  useAuth: () => auth,
}));

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

const targets = ['/app', '/cambiar-contrasena'];

beforeEach(() => auth.login.mockReset());
afterEach(cleanup);

async function submit(email: string, password: string) {
  const ue = userEvent.setup();
  if (email) await ue.type(screen.getByLabelText('Correo'), email);
  if (password) await ue.type(screen.getByLabelText('Contraseña', { exact: true }), password);
  await ue.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('Login', () => {
  it('pide correo y contraseña antes de llamar a la API', async () => {
    renderAt('/login', <Login />, targets);
    await submit('', '');
    expect(screen.getByRole('alert').textContent).toContain('Escribe tu correo y tu contraseña');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('muestra el error de credenciales en español', async () => {
    auth.login.mockRejectedValueOnce(new ApiError(401, { code: 'INVALID_CREDENTIALS' }));
    renderAt('/login', <Login />, targets);
    await submit('ana@empresa.com', 'mala');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'El correo o la contraseña no son correctos',
    );
  });

  it('con contraseña temporal lleva a cambiarla', async () => {
    auth.login.mockResolvedValueOnce({ ...user, mustChangePassword: true });
    renderAt('/login', <Login />, targets);
    await submit('ana@empresa.com', 'temporal-123');
    expect((await screen.findByTestId('where')).textContent).toBe('/cambiar-contrasena');
    expect(auth.login).toHaveBeenCalledWith('ana@empresa.com', 'temporal-123');
  });

  it('con sesión válida entra a la app', async () => {
    auth.login.mockResolvedValueOnce(user);
    renderAt('/login', <Login />, targets);
    await submit('ana@empresa.com', 'segura-2026');
    expect((await screen.findByTestId('where')).textContent).toBe('/app');
  });
});
