import { describe, expect, it } from 'vitest';
import { ApiError, errorMessage, supportCode } from './errors';

describe('errorMessage', () => {
  it('traduce los códigos conocidos de la API', () => {
    expect(errorMessage(new ApiError(401, { code: 'INVALID_CREDENTIALS' }))).toBe(
      'El correo o la contraseña no son correctos.',
    );
    expect(errorMessage(new ApiError(409, { code: 'LAST_ADMIN' }))).toContain('administrador');
  });

  it('un 5xx desconocido da un mensaje genérico, sin detalles técnicos', () => {
    expect(
      errorMessage(new ApiError(500, { code: 'INTERNAL', detail: 'NullPointerException' })),
    ).toBe('Algo falló en el servidor. Inténtalo de nuevo.');
  });

  it('un 4xx desconocido usa el detalle del problema', () => {
    expect(errorMessage(new ApiError(400, { code: 'NEW_CODE', detail: 'Algo concreto' }))).toBe(
      'Algo concreto',
    );
  });

  it('cualquier otro error se trata como fallo de red', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toContain('No pudimos conectar');
  });

  it('RATE_LIMITED sin Retry-After pide esperar un momento', () => {
    expect(errorMessage(new ApiError(429, { code: 'RATE_LIMITED' }))).toContain(
      'Espera un momento',
    );
  });
});

describe('ApiError', () => {
  it('fieldErrors devuelve los campos rechazados con un texto en español', () => {
    const err = new ApiError(400, {
      code: 'VALIDATION_ERROR',
      errors: { email: 'must be a well-formed email address' },
    });
    expect(err.fieldErrors).toEqual({ email: 'Revisa este campo.' });
  });

  it('sin código usa HTTP_<status>', () => {
    expect(new ApiError(404, {}).code).toBe('HTTP_404');
  });
});

describe('supportCode', () => {
  it('solo se muestra en errores del servidor', () => {
    expect(supportCode(new ApiError(503, { traceId: 'abc-123' }))).toBe('abc-123');
    expect(supportCode(new ApiError(400, { traceId: 'abc-123' }))).toBeNull();
    expect(supportCode(new Error('x'))).toBeNull();
  });
});
