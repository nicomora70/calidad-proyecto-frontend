import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/app/AppShell';
import { CapitalInput } from '../../components/app/CapitalInput';
import { DateRange } from '../../components/app/DateRange';
import { Button } from '../../components/ui/Button';
import { FormError, Spinner } from '../../components/ui/Field';
import {
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Pagination,
  Signed,
  Skeleton,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api, download } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import {
  formatDateTime,
  formatDay,
  formatMoney,
  formatPct,
  formatSignedMoney,
} from '../../lib/format';
import { keys, useMySimulations, type DateFilter } from '../../lib/queries';
import type { Simulation } from '../../types/api';

function NewSimulation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [capital, setCapital] = useState('');
  const [fieldError, setFieldError] = useState<string>();

  const create = useMutation({
    mutationFn: (initialCapital: number) =>
      api<Simulation>('/api/v1/simulations', { method: 'POST', body: { initialCapital } }),
    onSuccess: (sim) => {
      queryClient.setQueryData(keys.simulation(sim.id), sim);
      queryClient.invalidateQueries({ queryKey: ['me', 'simulations'] });
      navigate(`/app/simulaciones/${sim.id}`);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = Number(capital);
    if (!capital || amount <= 0) {
      setFieldError('Escribe un capital mayor que cero.');
      return;
    }
    setFieldError(undefined);
    create.mutate(amount);
  }

  return (
    <Card>
      <CardTitle>Nueva simulación</CardTitle>
      <form
        onSubmit={onSubmit}
        noValidate
        className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <CapitalInput value={capital} onChange={setCapital} error={fieldError} />
        <Button type="submit" className="h-12" disabled={create.isPending}>
          {create.isPending && <Spinner />}
          {create.isPending ? 'Simulando' : 'Simular'}
        </Button>
      </form>
      <div className="mt-4">
        <FormError message={create.isError ? errorMessage(create.error) : null} />
      </div>
      <p className="mt-3 text-sm text-ash">
        Usamos la última variación diaria del NASDAQ 100 y la multiplicamos por dos.
      </p>
    </Card>
  );
}

function History() {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<DateFilter>({});
  const [exporting, setExporting] = useState(false);
  const { data, isPending, isError, error, refetch } = useMySimulations(page, filter);

  async function exportCsv() {
    setExporting(true);
    try {
      await download('/api/v1/me/simulations/export', { ...filter }, 'mis-simulaciones.csv');
      toast('Historial exportado');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setExporting(false);
    }
  }

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
        Historial
      </CardTitle>
      <DateRange
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setPage(0);
        }}
      />

      <div className="mt-5">
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : data.content.length === 0 ? (
          <EmptyState
            title={
              filter.from || filter.to
                ? 'No hay simulaciones en esas fechas'
                : 'Aún no tienes simulaciones'
            }
            text={
              filter.from || filter.to
                ? 'Prueba con otro rango.'
                : 'Escribe un capital arriba para hacer la primera.'
            }
          />
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto sm:-mx-6">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-ash">
                    <th className="px-5 py-3 font-medium sm:px-6">Fecha</th>
                    <th className="px-3 py-3 text-right font-medium">Capital</th>
                    <th className="px-3 py-3 text-right font-medium">Índice</th>
                    <th className="px-3 py-3 text-right font-medium">Tu retorno</th>
                    <th className="px-5 py-3 text-right font-medium sm:px-6">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-line last:border-0 hover:bg-surface-2/60"
                    >
                      <td className="px-5 py-3 sm:px-6">
                        <Link
                          to={`/app/simulaciones/${s.id}`}
                          className="font-medium hover:text-ember"
                        >
                          {formatDateTime(s.createdAt)}
                        </Link>
                        <span className="block text-xs text-ash">
                          Mercado del {formatDay(s.marketDate)}
                        </span>
                      </td>
                      <td className="num px-3 py-3 text-right">
                        {formatMoney(s.initialCapital, s.currency)}
                      </td>
                      <td className="num px-3 py-3 text-right text-ash">
                        {formatPct(s.marketVariationPct)}
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
      </div>
    </Card>
  );
}

export default function Simulations() {
  return (
    <>
      <PageHeader
        title="Simulaciones"
        description="Calcula el resultado de tu capital con la variación real del NASDAQ 100 multiplicada por dos."
      />
      <div className="space-y-6">
        <NewSimulation />
        <History />
      </div>
    </>
  );
}
