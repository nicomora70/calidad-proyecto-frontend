import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../components/ui/Toast';
import { renderAt } from '../../test/render';
import Users from './Users';

const me = {
  id: 'admin-1',
  fullName: 'Ana Admin',
  email: 'ana@empresa.com',
  role: 'ADMIN' as const,
  active: true,
  mustChangePassword: false,
  lastLoginAt: null,
  createdAt: '2026-11-01T00:00:00Z',
};
const investor = {
  ...me,
  id: 'inv-1',
  fullName: 'Iván Inversor',
  email: 'ivan@empresa.com',
  role: 'INVESTOR' as const,
};

const api = vi.hoisted(() => vi.fn());
vi.mock('../../lib/api', () => ({ api }));
vi.mock('../../lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/auth')>()),
  useAuth: () => ({ status: 'authenticated', user: me }),
}));

beforeEach(() => {
  api.mockReset();
  api.mockImplementation((path: string) =>
    path === '/api/v1/users'
      ? Promise.resolve({ content: [me, investor], page: { totalPages: 1 } })
      : Promise.resolve(undefined),
  );
});
afterEach(cleanup);

function renderUsers() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  renderAt(
    '/app/usuarios',
    <QueryClientProvider client={client}>
      <ToastProvider>
        <Users />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('Users: supresión de datos (habeas data)', () => {
  it('no deja suprimir los datos de la propia cuenta', async () => {
    renderUsers();
    const own = await screen.findByRole('button', {
      name: 'Suprimir los datos personales de Ana Admin',
    });
    expect((own as HTMLButtonElement).disabled).toBe(true);
  });

  it('exige escribir el correo antes de llamar a la API', async () => {
    const ue = userEvent.setup();
    renderUsers();
    await ue.click(
      await screen.findByRole('button', { name: 'Suprimir los datos personales de Iván Inversor' }),
    );
    const submit = screen.getByRole('button', { name: 'Suprimir datos' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    await ue.type(
      screen.getByLabelText('Escribe ivan@empresa.com para confirmar'),
      'otro@empresa.com',
    );
    expect(submit.disabled).toBe(true);

    await ue.clear(screen.getByLabelText('Escribe ivan@empresa.com para confirmar'));
    await ue.type(
      screen.getByLabelText('Escribe ivan@empresa.com para confirmar'),
      'IVAN@empresa.com',
    );
    expect(submit.disabled).toBe(false);
    await ue.click(submit);

    await waitFor(() =>
      expect(api).toHaveBeenCalledWith('/api/v1/users/inv-1/anonymize', { method: 'POST' }),
    );
    expect(await screen.findByText('Datos personales suprimidos')).toBeTruthy();
  });
});
