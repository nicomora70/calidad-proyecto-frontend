export type Role = 'ADMIN' | 'IT_MANAGER' | 'INVESTOR';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
}

/** Cuerpo RFC 7807 que devuelve la API ante cualquier error. */
export interface Problem {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string>;
  [key: string]: unknown;
}
