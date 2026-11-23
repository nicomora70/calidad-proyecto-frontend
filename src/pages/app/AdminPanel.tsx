import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/app/AppShell';
import { DateRange } from '../../components/app/DateRange';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Field';
import {
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Pagination,
  Signed,
  Skeleton,
  selectClass,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api, download } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import { formatDateTime, formatMoney, formatPct, formatSignedMoney } from '../../lib/format';
import { useUserDirectory, type DateFilter } from '../../lib/queries';
import type { Page, Simulation, Statistics } from '../../types/api';

interface Filters extends DateFilter {
  userId?: string;
}

function Metric({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <p className="text-sm text-ash">{label}</p>
      <p className="num mt-2 font-display text-2xl font-extrabold">{children}</p>
      {hint && <p className="mt-1 text-xs text-ash">{hint}</p>}
    </div>
  );
}

function StatsGrid({ filters }: { filters: Filters }) {
  const {
    data: s,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'statistics', filters],
    queryFn: ({ signal }) =>
      api<Statistics>('/api/v1/dashboard/statistics', { query: { ...filters }, signal }),
    placeholderData: keepPreviousData,
  });

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <Card>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Card>
    );
  }
  if (s.count === 0) {
    return (
      <Card>
        <EmptyState
          title="No hay simulaciones con esos filtros"
          text="Las estadísticas aparecen en cuanto haya al menos una."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Resultado total" hint="Suma de ganancias y pérdidas">
          <Signed value={s.totalProfit}>{formatSignedMoney(s.totalProfit)}</Signed>
        </Metric>
        <Metric label="Capital simulado">{formatMoney(s.totalCapital)}</Metric>
        <Metric label="Simulaciones">{s.count.toLocaleString('es-CO')}</Metric>
        <Metric label="Con ganancia" hint="Porcentaje de simulaciones positivas">
          {formatPct(s.winRatePct).replace('+', '')}
        </Metric>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Retorno medio"
          hint={`Ponderado por capital: ${formatPct(s.weightedReturnPct)}`}
        >
          <Signed value={s.meanReturnPct}>{formatPct(s.meanReturnPct)}</Signed>
        </Metric>
        <Metric
          label="Mejor y peor retorno"
          hint={`Volatilidad (desviación estándar): ${formatPct(s.stdevReturnPct).replace('+', '')}`}
        >
          <Signed value={s.bestReturnPct}>{formatPct(s.bestReturnPct)}</Signed>
          <span className="mx-2 text-ash">/</span>
          <Signed value={s.worstReturnPct}>{formatPct(s.worstReturnPct)}</Signed>
        </Metric>
        <Metric
          label="Máxima caída acumulada"
          hint="Peor retroceso desde un máximo, en orden cronológico"
        >
          <span className="text-frost">{formatPct(-Math.abs(s.maxDrawdownPct))}</span>
        </Metric>
      </div>
    </div>
  );
}

function AllSimulations({ filters }: { filters: Filters }) {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const directory = useUserDirectory();
  const key = JSON.stringify(filters);
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) {
    // Cambiar filtros vuelve a la primera página.
    setLastKey(key);
    setPage(0);
  }

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['simulations', 'all', page, filters],
    queryFn: ({ signal }) =>
      api<Page<Simulation>>('/api/v1/simulations', {
        query: { page, size: 15, ...filters },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  async function exportCsv() {
    setExporting(true);
    try {
      await download('/api/v1/simulations/export', { ...filters }, 'simulaciones.csv');
      toast('Simulaciones exportadas');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  }

  const nameOf = (id: string) => directory.data?.byId.get(id)?.fullName ?? 'Usuario eliminado';

  return (
    <Card>
      <CardTitle
        action={
          <Button
            variant="ghost"
            className="h-10"
            onClick={exportCsv}
            disabled={exporting || !data?.page.totalElements}
          >
            {exporting ? <Spinner /> : <Download size={16} />}
            Exportar CSV
          </Button>
        }
      >
        Todas las simulaciones
      </CardTitle>
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.content.length === 0 ? (
        <EmptyState title="No hay simulaciones con esos filtros" />
      ) : (
        <>
          <div className="-mx-5 overflow-x-auto sm:-mx-6">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-ash">
                  <th className="px-5 py-3 font-medium sm:px-6">Persona</th>
                  <th className="px-3 py-3 font-medium">Fecha</th>
                  <th className="px-3 py-3 text-right font-medium">Capital</th>
                  <th className="px-3 py-3 text-right font-medium">Retorno</th>
                  <th className="px-5 py-3 text-right font-medium sm:px-6">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-line last:border-0 hover:bg-surface-2/60"
                  >
                    <td className="px-5 py-3 font-medium sm:px-6">{nameOf(s.userId)}</td>
                    <td className="px-3 py-3">
                      <Link to={`/app/simulaciones/${s.id}`} className="hover:text-ember">
                        {formatDateTime(s.createdAt)}
                      </Link>
                    </td>
                    <td className="num px-3 py-3 text-right">
                      {formatMoney(s.initialCapital, s.currency)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      <Signed value={s.returnPct}>{formatPct(s.returnPct)}</Signed>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold sm:px-6">
                      <Signed value={s.profit}>{formatSignedMoney(s.profit, s.currency)}</Signed>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
        </>
      )}
    </Card>
  );
}

export default function AdminPanel() {
  const [filters, setFilters] = useState<Filters>({});
  const directory = useUserDirectory();

  return (
    <>
      <PageHeader title="Panel" description="Resultados de todas las simulaciones de la empresa." />
      <div className="mb-6 flex flex-wrap items-end gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-ash">Persona</span>
          <select
            className={`${selectClass} min-w-48`}
            value={filters.userId ?? ''}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value || undefined })}
          >
            <option value="">Todas</option>
            {directory.data?.list.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </label>
        <DateRange value={filters} onChange={(d) => setFilters({ userId: filters.userId, ...d })} />
      </div>
      <div className="space-y-6">
        <StatsGrid filters={filters} />
        <AllSimulations filters={filters} />
      </div>
    </>
  );
}
