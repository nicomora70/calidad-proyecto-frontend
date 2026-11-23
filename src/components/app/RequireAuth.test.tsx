import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../../types/api';
import { RequireAuth } from './RequireAuth';

const auth = vi.hoisted(() => ({
  status: 'anonymous' as 'loading' | 'anonymous' | 'authenticated',
  user: null as User | null,
}));

vi.mock('../../lib/auth', () => ({ useAuth: () => auth }));

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

function LoginProbe() {
  const location = useLocation();
  return <p>login desde {(location.state as { from?: string } | null)?.from}</p>;
}

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<LoginProbe />} />
        <Route path="/cambiar-contrasena" element={<p>cambiar contraseña</p>} />
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <p>contenido privado</p>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('RequireAuth', () => {
  it('sin sesión redirige al login conservando la ruta de origen', () => {
    Object.assign(auth, { status: 'anonymous', user: null });
    renderAt('/app/simulaciones?page=2');
    expect(screen.getByText('login desde /app/simulaciones?page=2')).toBeTruthy();
  });

  it('con contraseña temporal obliga a cambiarla', () => {
    Object.assign(auth, { status: 'authenticated', user: { ...user, mustChangePassword: true } });
    renderAt('/app');
    expect(screen.getByText('cambiar contraseña')).toBeTruthy();
  });

  it('con sesión válida muestra el contenido', () => {
    Object.assign(auth, { status: 'authenticated', user });
    renderAt('/app');
    expect(screen.getByText('contenido privado')).toBeTruthy();
  });

  it('mientras restaura la sesión muestra un indicador de carga', () => {
    Object.assign(auth, { status: 'loading', user: null });
    renderAt('/app');
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
