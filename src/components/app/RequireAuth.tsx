import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import type { Role } from '../../types/api';
import { Spinner } from '../ui/Field';

export function FullScreenLoader() {
  return (
    <div
      className="grid min-h-dvh place-items-center text-ember"
      role="status"
      aria-label="Cargando"
    >
      <Spinner className="size-6" />
    </div>
  );
}

/** Protege la app: exige sesión y que la contraseña temporal ya se haya cambiado. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'anonymous' || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (user.mustChangePassword) return <Navigate to="/cambiar-contrasena" replace />;
  return <>{children}</>;
}

/** Restringe una ruta a ciertos roles; los demás ven un aviso claro en vez de un error. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { hasRole } = useAuth();
  if (!hasRole(...roles)) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Esta sección no está disponible para tu rol
        </h1>
        <p className="mt-2 text-ash">
          Si la necesitas, pídele acceso al administrador de tu empresa.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
