import { PageHeader } from '../../components/app/AppShell';
import { ROLE_LABEL, useAuth } from '../../lib/auth';
import { formatDateTime } from '../../lib/format';

export default function Home() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeader
        title={`Hola, ${user.fullName.split(' ')[0]}`}
        description={`Ingresaste como ${ROLE_LABEL[user.role].toLowerCase()}.`}
      />
      <section className="rounded-shell border border-line bg-surface p-6 shadow-soft sm:p-8">
        <dl className="grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ash">Correo</dt>
            <dd className="mt-1 font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Último ingreso</dt>
            <dd className="mt-1 font-medium">
              {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Este es tu primer ingreso'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Cuenta creada</dt>
            <dd className="mt-1 font-medium">{formatDateTime(user.createdAt)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
