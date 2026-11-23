import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/app/AuthLayout';
import { Button } from '../components/ui/Button';
import { Field, FormError, Spinner } from '../components/ui/Field';
import { homeFor, useAuth } from '../lib/auth';
import { ApiError, errorMessage } from '../lib/errors';

export default function Login() {
  const { status, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated' && user && !submitting) {
    return <Navigate to={homeFor(user)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      const u = await login(email, password);
      const target = u.mustChangePassword
        ? '/cambiar-contrasena'
        : from?.startsWith('/app')
          ? from
          : homeFor(u);
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Ingresar"
      intro="Usa la cuenta que te entregó el administrador de tu empresa."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormError message={error} />
        <Field
          label="Correo"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          autoFocus
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner />}
          {submitting ? 'Ingresando' : 'Ingresar'}
        </Button>
        <p className="text-sm text-ash">
          ¿Olvidaste tu contraseña? Pídele al administrador de tu empresa una contraseña temporal.
        </p>
      </form>
    </AuthLayout>
  );
}
