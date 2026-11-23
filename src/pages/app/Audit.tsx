import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronDown, Download } from 'lucide-react';
import { Fragment, useState } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { DateRange } from '../../components/app/DateRange';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Field';
import {
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  selectClass,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api, download } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { useUserDirectory, type DateFilter } from '../../lib/queries';
import type { AuditEntry, Page } from '../../types/api';

/** Acciones que registra el backend, en lenguaje claro. */
const ACTIONS: Record<string, string> = {
  LOGIN_SUCCESS: 'Ingreso',
  LOGIN_FAILED: 'Ingreso fallido',
  LOGIN_BLOCKED: 'Ingreso bloqueado',
  ACCOUNT_LOCKED: 'Cuenta bloqueada',
  LOGOUT: 'Salida',
  PASSWORD_CHANGED: 'Cambio de contraseña',
  REFRESH_TOKEN_REUSED: 'Reutilización de sesión',
  USER_CREATED: 'Usuario creado',
  USER_ACTIVATED: 'Usuario activado',
  USER_DEACTIVATED: 'Usuario desactivado',
  ROLE_CHANGED: 'Cambio de rol',
  USER_DELETED: 'Usuario eliminado',
  USER_ANONYMIZED: 'Datos personales suprimidos',
  BOOTSTRAP_ADMIN_CREATED: 'Administrador inicial creado',
  SIMULATION_CREATED: 'Simulación',
  PROJECTION_CREATED: 'Proyección',
  EXPORT_CREATED: 'Exporte',
  BRANDING_UPDATED: 'Branding actualizado',
  LICENSE_INSTALLED: 'Licencia instalada',
};

/** Eventos que merecen atención: se marcan en frío para distinguirlos del resto. */
const SECURITY = new Set([
  'LOGIN_FAILED',
  'LOGIN_BLOCKED',
  'ACCOUNT_LOCKED',
  'REFRESH_TOKEN_REUSED',
]);

interface Filters extends DateFilter {
  action?: string;
  actorId?: string;
}

export default function Audit() {
  const { hasRole, user: me } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const directory = useUserDirectory(isAdmin);
  const toast = useToast();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['audit', page, filters],
    queryFn: ({ signal }) =>
      api<Page<AuditEntry>>('/api/v1/audit', { query: { page, size: 25, ...filters }, signal }),
    placeholderData: keepPreviousData,
  });

  const update = (f: Filters) => {
    setFilters(f);
    setPage(0);
  };

  const actorName = (id: string | null) => {
    if (!id) return 'Sistema';
    if (id === me?.id) return `${me.fullName} (tú)`;
    return directory.data?.byId.get(id)?.fullName ?? `Usuario ${id.slice(0, 8)}`;
  };

  async function exportCsv() {
    setExporting(true);
    try {
      await download('/api/v1/audit/export', { ...filters }, 'auditoria.csv');
      toast('Auditoría exportada');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Registro de ingresos, cambios de cuentas y operaciones. No se puede editar ni borrar."
        actions={
          <Button
            variant="ghost"
            onClick={exportCsv}
            disabled={exporting || !data?.page.totalElements}
          >
            {exporting ? <Spinner /> : <Download size={16} />}
            Exportar CSV
          </Button>
        }
      />
      <Card>
        <div className="mb-5 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-ash">Acción</span>
            <select
              className={selectClass}
              value={filters.action ?? ''}
              onChange={(e) => update({ ...filters, action: e.target.value || undefined })}
            >
              <option value="">Todas</option>
              {Object.entries(ACTIONS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {isAdmin && (
            <label className="text-sm">
              <span className="mb-1 block text-ash">Persona</span>
              <select
                className={`${selectClass} min-w-44`}
                value={filters.actorId ?? ''}
                onChange={(e) => update({ ...filters, actorId: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                {directory.data?.list.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
          <DateRange
            value={filters}
            onChange={(d) => update({ action: filters.action, actorId: filters.actorId, ...d })}
          />
        </div>

        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.content.length === 0 ? (
          <EmptyState title="No hay registros con esos filtros" />
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ash">
                    <th className="px-5 py-3 font-medium sm:px-6">Fecha</th>
                    <th className="px-3 py-3 font-medium">Acción</th>
                    <th className="px-3 py-3 font-medium">Persona</th>
                    <th className="px-3 py-3 font-medium">IP</th>
                    <th className="px-5 py-3 sm:px-6">
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((a) => {
                    const expanded = open === a.id;
                    return (
                      <Fragment key={a.id}>
                        <tr
                          className={`border-b border-line ${expanded ? 'bg-surface-2/60' : 'hover:bg-surface-2/60'}`}
                        >
                          <td className="num px-5 py-2.5 whitespace-nowrap sm:px-6">
                            {formatDateTime(a.createdAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={
                                SECURITY.has(a.action) ? 'font-medium text-frost' : 'font-medium'
                              }
                            >
                              {ACTIONS[a.action] ?? a.action}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">{actorName(a.actorId)}</td>
                          <td className="num px-3 py-2.5 text-ash">{a.ipAddress ?? '—'}</td>
                          <td className="px-5 py-2.5 text-right sm:px-6">
                            <button
                              type="button"
                              aria-expanded={expanded}
                              aria-controls={`audit-${a.id}`}
                              onClick={() => setOpen(expanded ? null : a.id)}
                              className="inline-flex items-center gap-1 rounded-ctrl px-2 py-1 text-xs text-ash hover:text-ink"
                            >
                              Detalle
                              <ChevronDown
                                size={14}
                                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr id={`audit-${a.id}`} className="border-b border-line bg-surface-2/60">
                            <td colSpan={5} className="px-5 pb-4 sm:px-6">
                              <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                                <div>
                                  <dt className="text-ash">Código</dt>
                                  <dd className="num">{a.action}</dd>
                                </div>
                                <div>
                                  <dt className="text-ash">Sobre</dt>
                                  <dd className="num break-all">
                                    {a.entityType ?? '—'}
                                    {a.entityId && ` ${a.entityId}`}
                                  </dd>
                                </div>
                                <div className="sm:col-span-2">
                                  <dt className="text-ash">Navegador</dt>
                                  <dd className="break-all">{a.userAgent ?? '—'}</dd>
                                </div>
                                {a.details && (
                                  <div className="sm:col-span-2">
                                    <dt className="text-ash">Detalles</dt>
                                    <dd className="break-all whitespace-pre-wrap">{a.details}</dd>
                                  </div>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
