import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Pencil, RefreshCw, Trash2, UserPlus, UserX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Spinner } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import {
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  selectClass,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { ROLE_LABEL, useAuth } from '../../lib/auth';
import { ApiError, errorMessage } from '../../lib/errors';
import { formatDate, formatDateTime } from '../../lib/format';
import type { Page, Role, User } from '../../types/api';

const ROLES: Role[] = ['INVESTOR', 'ADMIN', 'IT_MANAGER'];

/** Contraseña temporal legible: sin caracteres que se confunden (0/O, 1/l/I). */
function generatePassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['users'] });
}

function RoleSelect({
  value,
  onChange,
  id,
}: {
  value: Role;
  onChange: (r: Role) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      className={`${selectClass} h-11 w-full`}
      value={value}
      onChange={(e) => onChange(e.target.value as Role)}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
        }
      }}
      aria-label={copied ? 'Copiado' : 'Copiar'}
      className="grid size-9 place-items-center rounded-ctrl border border-line text-ash hover:text-ink"
    >
      {copied ? <Check size={16} className="text-ember" /> : <Copy size={16} />}
    </button>
  );
}

function CreateUser({ onClose }: { onClose: () => void }) {
  const invalidate = useInvalidateUsers();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'INVESTOR' as Role,
    temporaryPassword: generatePassword(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<User | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api<User>('/api/v1/users', {
        method: 'POST',
        body: { ...form, email: form.email.trim(), fullName: form.fullName.trim() },
      }),
    onSuccess: (u) => {
      invalidate();
      setCreated(u);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'EMAIL_ALREADY_EXISTS')
        setErrors({ email: errorMessage(err) });
      else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR')
        setErrors(err.fieldErrors);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!form.fullName.trim()) v.fullName = 'Escribe el nombre completo.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) v.email = 'Escribe un correo válido.';
    if (form.temporaryPassword.length < 8 || form.temporaryPassword.length > 72)
      v.temporaryPassword = 'Usa entre 8 y 72 caracteres.';
    setErrors(v);
    if (!Object.keys(v).length) create.mutate();
  }

  if (created) {
    return (
      <Modal
        title="Usuario creado"
        description="Entrégale estos datos por un canal seguro. En su primer ingreso deberá cambiar la contraseña."
        onClose={onClose}
      >
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-ash">Correo</dt>
            <dd className="mt-1 flex items-center justify-between gap-3 rounded-ctrl bg-bg px-3.5 py-2.5">
              <span className="truncate font-medium">{created.email}</span>
              <CopyButton text={created.email} />
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Contraseña temporal</dt>
            <dd className="mt-1 flex items-center justify-between gap-3 rounded-ctrl bg-bg px-3.5 py-2.5">
              <span className="num font-medium select-all">{form.temporaryPassword}</span>
              <CopyButton text={form.temporaryPassword} />
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ash">
          No volverás a ver esta contraseña cuando cierres este diálogo.
        </p>
        <Button className="mt-6 w-full" onClick={onClose}>
          Listo
        </Button>
      </Modal>
    );
  }

  return (
    <Modal
      title="Crear usuario"
      description="La persona recibirá acceso con una contraseña temporal."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError
          message={
            create.isError && !Object.keys(errors).length ? errorMessage(create.error) : null
          }
        />
        <Field
          label="Nombre completo"
          value={form.fullName}
          maxLength={120}
          autoComplete="off"
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          error={errors.fullName}
        />
        <Field
          label="Correo"
          type="email"
          value={form.email}
          maxLength={150}
          autoComplete="off"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          error={errors.email}
        />
        <div>
          <label htmlFor="new-user-role" className="mb-1.5 block text-sm font-medium">
            Rol
          </label>
          <RoleSelect
            id="new-user-role"
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
          />
        </div>
        <div className="flex items-end gap-2">
          <Field
            className="flex-1"
            label="Contraseña temporal"
            value={form.temporaryPassword}
            onChange={(e) => setForm({ ...form, temporaryPassword: e.target.value })}
            error={errors.temporaryPassword}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setForm({ ...form, temporaryPassword: generatePassword() })}
            aria-label="Generar otra contraseña"
            className={`grid size-11 shrink-0 place-items-center rounded-ctrl border border-line text-ash hover:text-ink ${errors.temporaryPassword ? 'mb-7' : ''}`}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={create.isPending}>
            {create.isPending && <Spinner />}
            Crear usuario
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditUser({ user, onClose }: { user: User; onClose: () => void }) {
  const invalidate = useInvalidateUsers();
  const toast = useToast();
  const [fullName, setFullName] = useState(user.fullName);
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [nameError, setNameError] = useState<string>();

  const save = useMutation({
    mutationFn: async () => {
      const nameChanged = fullName.trim() !== user.fullName;
      if (nameChanged || active !== user.active) {
        await api(`/api/v1/users/${user.id}`, {
          method: 'PATCH',
          body: {
            fullName: nameChanged ? fullName.trim() : undefined,
            active: active !== user.active ? active : undefined,
          },
        });
      }
      if (role !== user.role) {
        await api(`/api/v1/users/${user.id}/role`, { method: 'PATCH', body: { role } });
      }
    },
    onSuccess: () => {
      invalidate();
      toast('Cambios guardados');
      onClose();
    },
    // Si una de las dos llamadas falló, la lista debe reflejar lo que sí se guardó.
    onError: () => invalidate(),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError('Escribe el nombre completo.');
      return;
    }
    setNameError(undefined);
    save.mutate();
  }

  return (
    <Modal title="Editar usuario" description={user.email} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={save.isError ? errorMessage(save.error) : null} />
        <Field
          label="Nombre completo"
          value={fullName}
          maxLength={120}
          onChange={(e) => setFullName(e.target.value)}
          error={nameError}
        />
        <div>
          <label htmlFor="edit-user-role" className="mb-1.5 block text-sm font-medium">
            Rol
          </label>
          <RoleSelect id="edit-user-role" value={role} onChange={setRole} />
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-ctrl border border-line px-3.5 py-3">
          <span>
            <span className="block text-sm font-medium">Cuenta activa</span>
            <span className="block text-xs text-ash">Una cuenta inactiva no puede ingresar.</span>
          </span>
          <input
            type="checkbox"
            className="size-4 accent-[var(--ember)]"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
        </label>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={save.isPending}>
            {save.isPending && <Spinner />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteUser({ user, onClose }: { user: User; onClose: () => void }) {
  const invalidate = useInvalidateUsers();
  const toast = useToast();
  const remove = useMutation({
    mutationFn: () => api(`/api/v1/users/${user.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      toast('Usuario eliminado');
      onClose();
    },
  });
  return (
    <Modal
      title={`¿Eliminar a ${user.fullName}?`}
      description="Perderá el acceso. Sus simulaciones se conservan en el historial."
      onClose={onClose}
    >
      <FormError message={remove.isError ? errorMessage(remove.error) : null} />
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          className="flex-1"
          onClick={() => remove.mutate()}
          disabled={remove.isPending}
        >
          {remove.isPending ? <Spinner /> : <Trash2 size={16} />}
          Eliminar usuario
        </Button>
      </div>
    </Modal>
  );
}

function AnonymizeUser({ user, onClose }: { user: User; onClose: () => void }) {
  const invalidate = useInvalidateUsers();
  const toast = useToast();
  const [confirmation, setConfirmation] = useState('');
  const matches = confirmation.trim().toLowerCase() === user.email.toLowerCase();
  const anonymize = useMutation({
    mutationFn: () => api(`/api/v1/users/${user.id}/anonymize`, { method: 'POST' }),
    onSuccess: () => {
      invalidate();
      toast('Datos personales suprimidos');
      onClose();
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (matches) anonymize.mutate();
  }

  return (
    <Modal
      title={`¿Suprimir los datos de ${user.fullName}?`}
      description="Ley 1581 (habeas data). Se reemplazan el nombre y el correo, se cierran sus sesiones y se borra su bandeja. Las simulaciones quedan en el historial sin datos personales. No se puede deshacer."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormError message={anonymize.isError ? errorMessage(anonymize.error) : null} />
        <Field
          label={`Escribe ${user.email} para confirmar`}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="danger"
            className="flex-1"
            disabled={!matches || anonymize.isPending}
          >
            {anonymize.isPending ? <Spinner /> : <UserX size={16} />}
            Suprimir datos
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: User }
  | { kind: 'delete'; user: User }
  | { kind: 'anonymize'; user: User }
  | null;

export default function Users() {
  const { user: me } = useAuth();
  const [page, setPage] = useState(0);
  const [role, setRole] = useState<'' | Role>('');
  const [status, setStatus] = useState<'' | 'true' | 'false'>('');
  const [dialog, setDialog] = useState<Dialog>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['users', 'list', page, role, status],
    queryFn: ({ signal }) =>
      api<Page<User>>('/api/v1/users', { query: { page, size: 15, role, active: status }, signal }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Crea cuentas, asigna roles y desactiva el acceso de quien ya no lo necesita."
        actions={
          <Button onClick={() => setDialog({ kind: 'create' })}>
            <UserPlus size={16} /> Crear usuario
          </Button>
        }
      />
      <Card>
        <div className="mb-5 flex flex-wrap gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-ash">Rol</span>
            <select
              className={selectClass}
              value={role}
              onChange={(e) => {
                setRole(e.target.value as '' | Role);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ash">Estado</span>
            <select
              className={selectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | 'true' | 'false');
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>
        </div>

        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.content.length === 0 ? (
          <EmptyState title="No hay usuarios con esos filtros" />
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ash">
                    <th className="px-5 py-3 font-medium sm:px-6">Persona</th>
                    <th className="px-3 py-3 font-medium">Rol</th>
                    <th className="px-3 py-3 font-medium">Estado</th>
                    <th className="px-3 py-3 font-medium">Último ingreso</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((u) => {
                    const isMe = u.id === me?.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-line last:border-0 hover:bg-surface-2/60"
                      >
                        <td className="px-5 py-3 sm:px-6">
                          <span className="block font-medium">
                            {u.fullName}
                            {isMe && <span className="ml-2 text-xs text-ash">(tú)</span>}
                          </span>
                          <span className="block text-xs text-ash">{u.email}</span>
                        </td>
                        <td className="px-3 py-3">{ROLE_LABEL[u.role]}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 ${u.active ? '' : 'text-ash'}`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${u.active ? 'bg-ember' : 'bg-ash'}`}
                              aria-hidden
                            />
                            {u.active ? 'Activo' : 'Inactivo'}
                          </span>
                          {u.mustChangePassword && (
                            <span className="block text-xs text-ash">Contraseña temporal</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-ash">
                          {u.lastLoginAt
                            ? formatDateTime(u.lastLoginAt)
                            : `Nunca (creado el ${formatDate(u.createdAt)})`}
                        </td>
                        <td className="px-5 py-3 sm:px-6">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDialog({ kind: 'edit', user: u })}
                              aria-label={`Editar a ${u.fullName}`}
                              className="grid size-9 place-items-center rounded-ctrl text-ash hover:bg-surface-2 hover:text-ink"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDialog({ kind: 'delete', user: u })}
                              disabled={isMe}
                              title={isMe ? 'No puedes eliminar tu propia cuenta' : undefined}
                              aria-label={`Eliminar a ${u.fullName}`}
                              className="grid size-9 place-items-center rounded-ctrl text-ash hover:bg-surface-2 hover:text-frost disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDialog({ kind: 'anonymize', user: u })}
                              disabled={isMe}
                              title={
                                isMe
                                  ? 'No puedes suprimir tus propios datos'
                                  : 'Suprimir datos personales (habeas data)'
                              }
                              aria-label={`Suprimir los datos personales de ${u.fullName}`}
                              className="grid size-9 place-items-center rounded-ctrl text-ash hover:bg-surface-2 hover:text-frost disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <UserX size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      {dialog?.kind === 'create' && <CreateUser onClose={() => setDialog(null)} />}
      {dialog?.kind === 'edit' && <EditUser user={dialog.user} onClose={() => setDialog(null)} />}
      {dialog?.kind === 'delete' && (
        <DeleteUser user={dialog.user} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'anonymize' && (
        <AnonymizeUser user={dialog.user} onClose={() => setDialog(null)} />
      )}
    </>
  );
}
