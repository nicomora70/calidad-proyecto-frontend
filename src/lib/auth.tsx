import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Role, TokenResponse, User } from '../types/api';
import { api, refreshSession, setSessionListener, storeSession, storedRefreshToken } from './api';

type Status = 'loading' | 'anonymous' | 'authenticated';

interface AuthValue {
  status: Status;
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>(() =>
    storedRefreshToken() ? 'loading' : 'anonymous',
  );

  useEffect(() => {
    setSessionListener((session) => {
      setUser(session?.user ?? null);
      setStatus(session ? 'authenticated' : 'anonymous');
      if (!session) queryClient.clear();
    });
    // Restaura la sesión tras recargar la pestaña.
    if (storedRefreshToken()) {
      refreshSession().catch(() => setStatus('anonymous'));
    }
    return () => setSessionListener(null);
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await api<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email: email.trim(), password },
      auth: false,
    });
    storeSession(session);
    return session.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const session = await api<TokenResponse>('/api/v1/auth/change-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    });
    storeSession(session);
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = storedRefreshToken();
    if (refreshToken) {
      // Si falla, el token expira solo; la sesión local se cierra igual.
      // Endpoint público: sin Bearer, para que nunca intente renovar la sesión que se está cerrando.
      await api('/api/v1/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
      }).catch(() => {});
    }
    storeSession(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      login,
      changePassword,
      logout,
      hasRole: (...roles) => !!user && roles.includes(user.role),
    }),
    [status, user, login, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  IT_MANAGER: 'Gerente de TI',
  INVESTOR: 'Inversionista',
};

/** Primera pantalla de cada rol después de ingresar. */
export function homeFor(user: User): string {
  return user.mustChangePassword ? '/cambiar-contrasena' : '/app';
}
