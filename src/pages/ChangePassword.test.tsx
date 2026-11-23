import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/errors';
import { renderAt } from '../test/render';
import ChangePassword from './ChangePassword';

const auth = vi.hoisted(() => ({
  status: 'authenticated' as const,
  user: {
    id: 'u1',
    fullName: 'Ana Pérez',
    email: 'ana@empresa.com',
    role: 'INVESTOR' as const,
    active: true,
    mustChangePassword: true,
    lastLoginAt: null,
    createdAt: '2026-11-01T00:00:00Z',
  },
  changePassword: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/auth')>()),
  useAuth: () => auth,
}));

beforeEach(() => auth.changePassword.mockReset());
afterEach(cleanup);

async function fill(current: string, next: string, confirm: string) {
  const ue = userEvent.setup();
  if (current) await ue.type(screen.getByLabelText('Contraseña temporal'), current);
  if (next) await ue.type(screen.getByLabelText('Nueva contraseña'), next);
  if (confirm) await ue.type(screen.getByLabelText('Confirma la nueva contraseña'), confirm);
  await ue.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
}

describe('ChangePassword', () => {
  it('saluda y explica el cambio obligatorio', () => {
    renderAt('/cambiar-contrasena', <ChangePassword />);
    expect(screen.getByRole('heading', { name: 'Elige tu contraseña' })).toBeTruthy();
    expect(screen.getByText(/Hola, Ana/)).toBeTruthy();
  });

  it('valida longitud y confirmación antes de llamar a la API', async () => {
    renderAt('/cambiar-contrasena', <ChangePassword />);
    await fill('temporal-123', 'corta', 'otra');
    expect(screen.getByText('Usa entre 8 y 72 caracteres.')).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('no acepta repetir la contraseña actual', async () => {
    renderAt('/cambiar-contrasena', <ChangePassword />);
    await fill('temporal-123', 'temporal-123', 'temporal-123');
    expect(screen.getByText('Debe ser distinta de la actual.')).toBeTruthy();
  });

  it('marca la contraseña actual cuando el backend la rechaza', async () => {
    auth.changePassword.mockRejectedValueOnce(
      new ApiError(400, { code: 'INVALID_CURRENT_PASSWORD' }),
    );
    renderAt('/cambiar-contrasena', <ChangePassword />);
    await fill('equivocada', 'nueva-segura-1', 'nueva-segura-1');
    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeTruthy();
  });

  it('al guardar entra a la app', async () => {
    auth.changePassword.mockResolvedValueOnce({ ...auth.user, mustChangePassword: false });
    renderAt('/cambiar-contrasena', <ChangePassword />, ['/app']);
    await fill('temporal-123', 'nueva-segura-1', 'nueva-segura-1');
    expect((await screen.findByTestId('where')).textContent).toBe('/app');
    expect(auth.changePassword).toHaveBeenCalledWith('temporal-123', 'nueva-segura-1');
  });
});
