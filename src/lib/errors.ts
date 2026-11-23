import type { Problem } from '../types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: Problem;

  constructor(status: number, problem: Problem) {
    super(problem.detail ?? problem.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem.code ?? `HTTP_${status}`;
    this.problem = problem;
  }

  /** Campos rechazados por la validación del servidor, con un mensaje en español. */
  get fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      Object.keys(this.problem.errors ?? {}).map((field) => [field, 'Revisa este campo.']),
    );
  }
}

/** Mensajes en español por código estable de la API. */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  INVALID_CREDENTIALS: 'El correo o la contraseña no son correctos.',
  ACCOUNT_LOCKED: 'Tu cuenta está bloqueada por varios intentos fallidos. Espera unos minutos.',
  INVALID_REFRESH_TOKEN: 'Tu sesión terminó. Ingresa de nuevo.',
  TOKEN_EXPIRED: 'Tu sesión terminó. Ingresa de nuevo.',
  UNAUTHORIZED: 'Necesitas ingresar para continuar.',
  FORBIDDEN: 'Tu rol no tiene acceso a esta sección.',
  INVALID_CURRENT_PASSWORD: 'La contraseña actual no es correcta.',
  PASSWORD_REUSED: 'La nueva contraseña debe ser distinta de la actual.',
  PASSWORD_CHANGE_REQUIRED: 'Cambia tu contraseña temporal para continuar.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  INSUFFICIENT_CAPITAL: 'El capital no alcanza el mínimo permitido.',
  SIMULATION_NOT_FOUND: 'No encontramos esa simulación.',
  CALC_ENGINE_UNAVAILABLE: 'El motor de cálculo no responde. Inténtalo en unos minutos.',
  MARKET_DATA_UNAVAILABLE: 'No hay datos del mercado disponibles ahora. Inténtalo en unos minutos.',
  INSUFFICIENT_MARKET_HISTORY: 'Aún no hay suficiente historial del mercado para proyectar.',
  NEWS_UNAVAILABLE: 'Las noticias no están disponibles ahora.',
  NEWS_QUOTA_EXCEEDED: 'Se alcanzó el límite de consultas de noticias por hoy.',
  BUDGET_EXCEEDED: 'Se alcanzó el presupuesto de alertas con IA de este periodo.',
  AI_ALERT_NOT_FOUND: 'La alerta de esta simulación aún no está lista.',
  USER_NOT_FOUND: 'No encontramos ese usuario.',
  EMAIL_ALREADY_EXISTS: 'Ya existe un usuario con ese correo.',
  LAST_ADMIN: 'Debe quedar al menos un administrador activo.',
  INVALID_DATE_RANGE: 'El rango de fechas no es válido.',
  LICENSE_INVALID: 'La licencia de esta instalación no es válida. Contacta a tu administrador.',
  LICENSE_EXPIRED: 'La licencia de esta instalación venció. Contacta a tu administrador.',
  MODULE_NOT_LICENSED: 'Tu licencia no incluye este módulo.',
  LICENSE_USER_LIMIT: 'Se alcanzó el número máximo de usuarios de la licencia.',
  HTTP_404: 'No encontramos lo que buscabas.',
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'RATE_LIMITED') {
      const wait = Number(err.problem.retryAfter);
      return wait > 0
        ? `Hiciste muchas solicitudes seguidas. Espera ${Math.ceil(wait)} s e inténtalo de nuevo.`
        : 'Hiciste muchas solicitudes seguidas. Espera un momento e inténtalo de nuevo.';
    }
    return (
      MESSAGES[err.code] ??
      (err.status >= 500 ? 'Algo falló en el servidor. Inténtalo de nuevo.' : err.message)
    );
  }
  return MESSAGES.NETWORK_ERROR;
}

/** Código para soporte: el backend lo registra en sus logs (traceId / X-Request-Id). */
export function supportCode(err: unknown): string | null {
  if (err instanceof ApiError && err.status >= 500 && typeof err.problem.traceId === 'string') {
    return err.problem.traceId;
  }
  return null;
}
