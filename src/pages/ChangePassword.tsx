import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/app/AuthLayout';
import { Button } from '../components/ui/Button';
import { Field, FormError, Spinner } from '../components/ui/Field';
import { homeFor, useAuth } from '../lib/auth';
import { ApiError, errorMessage } from '../lib/errors';

const MIN = 8;
const MAX = 72;

export default function ChangePassword() {
  const { status, user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') return null;
  if (status === 'anonymous') return <Navigate to="/login" replace />;
  const forced = !!user?.mustChangePassword;

  function validate() {
    const e: Record<string, string> = {};
    if (!current) e.currentPassword = 'Escribe tu contraseña actual.';
    if (next.length < MIN || next.length > MAX)
      e.newPassword = `Usa entre ${MIN} y ${MAX} caracteres.`;
    else if (next === current) e.newPassword = 'Debe ser distinta de la actual.';
    if (confirm !== next) e.confirm = 'Las contraseñas no coinciden.';
    return e;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length) return;
    setSubmitting(true);
    try {
      const u = await changePassword(current, next);
      navigate(homeFor(u), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'INVALID_CURRENT_PASSWORD') {
        setErrors({ currentPassword: errorMessage(err) });
      } else if (err instanceof ApiError && err.code === 'PASSWORD_REUSED') {
        setErrors({ newPassword: errorMessage(err) });
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') {
        setErrors(err.fieldErrors);
        setFormError(errorMessage(err));
      } else {
        setFormError(errorMessage(err));
      }
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title={forced ? 'Elige tu contraseña' : 'Cambiar contraseña'}
      intro={
        forced
          ? `Hola, ${user?.fullName.split(' ')[0]}. Antes de empezar, cambia la contraseña temporal por una que solo tú conozcas.`
          : 'Tu sesión seguirá abierta con la nueva contraseña.'
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError message={formError} />
        <Field
          label={forced ? 'Contraseña temporal' : 'Contraseña actual'}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          error={errors.currentPassword}
          autoFocus
        />
        <Field
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={errors.newPassword}
          hint={`Entre ${MIN} y ${MAX} caracteres.`}
        />
        <Field
          label="Confirma la nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Guardando' : 'Guardar contraseña'}
        </Button>
        {forced ? (
          <Button type="button" variant="ghost" className="w-full" onClick={() => logout()}>
            Salir
          </Button>
        ) : (
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/app')}>
            Cancelar
          </Button>
        )}
      </form>
    </AuthLayout>
  );
}
