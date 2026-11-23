import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { Spinner } from '../../components/ui/Field';
import { Card, CardTitle, ErrorState, Skeleton } from '../../components/ui/Surface';
import { api } from '../../lib/api';
import { ApiError, errorMessage } from '../../lib/errors';
import {
  formatDateTime,
  formatDay,
  formatMoney,
  formatPct,
  formatSignedMoney,
} from '../../lib/format';
import { keys } from '../../lib/queries';
import type { AiAlert, Simulation } from '../../types/api';

const POLL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutos

function AlertCard({ simulationId }: { simulationId: string }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: keys.alert(simulationId),
    queryFn: ({ signal }) => api<AiAlert>(`/api/simulations/${simulationId}/alert`, { signal }),
    refetchInterval: (q) =>
      q.state.data?.status === 'PENDING' && q.state.dataUpdateCount < MAX_POLLS ? POLL_MS : false,
  });

  let body;
  if (isPending) {
    body = (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  } else if (isError) {
    const notFound = error instanceof ApiError && error.code === 'AI_ALERT_NOT_FOUND';
    body = notFound ? (
      <p className="text-ash">Esta simulación no tiene alerta con IA.</p>
    ) : (
      <ErrorState error={error} onRetry={() => refetch()} />
    );
  } else if (data.status === 'PENDING') {
    body = (
      <p className="flex items-center gap-2.5 text-ash" role="status">
        <Spinner className="text-ember" />
        Estamos analizando tu simulación. Esto toma unos segundos.
      </p>
    );
  } else if (data.status === 'FAILED') {
    body = <p className="text-ash">No pudimos generar la alerta para esta simulación.</p>;
  } else {
    body = (
      <>
        {data.title && <h3 className="font-display text-xl font-semibold">{data.title}</h3>}
        <p className="mt-3 max-w-[68ch] leading-relaxed whitespace-pre-line">{data.content}</p>
        <p className="mt-5 text-xs text-ash">{data.disclaimer}.</p>
        {data.completedAt && (
          <p className="mt-1 text-xs text-ash">Generada el {formatDateTime(data.completedAt)}</p>
        )}
      </>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 size-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }}
      />
      <CardTitle>
        <span className="flex items-center gap-2">
          <Sparkles size={18} className="text-ember" /> Alerta con IA
        </span>
      </CardTitle>
      <div className="relative">{body}</div>
    </Card>
  );
}

export default function SimulationDetail() {
  const { id = '' } = useParams();
  const {
    data: sim,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: keys.simulation(id),
    queryFn: ({ signal }) => api<Simulation>(`/api/simulations/${id}`, { signal }),
  });

  const back = (
    <Link
      to="/app/simulaciones"
      className="inline-flex items-center gap-1.5 text-sm text-ash hover:text-ink"
    >
      <ArrowLeft size={16} /> Simulaciones
    </Link>
  );

  if (isPending) {
    return (
      <>
        {back}
        <Skeleton className="mt-6 h-64" />
      </>
    );
  }
  if (isError) {
    return (
      <>
        {back}
        <Card className="mt-6">
          {error instanceof ApiError && error.status === 404 ? (
            <p className="py-10 text-center">{errorMessage(error)}</p>
          ) : (
            <ErrorState error={error} onRetry={() => refetch()} />
          )}
        </Card>
      </>
    );
  }

  const gain = sim.profit >= 0;
  return (
    <>
      {back}
      <section className="mt-6 rounded-shell border border-line bg-surface p-6 shadow-soft sm:p-10">
        <p className="text-ash">
          Con {formatMoney(sim.initialCapital, sim.currency)} el {formatDay(sim.marketDate)}
        </p>
        <p
          className={`num display mt-2 text-5xl font-extrabold sm:text-6xl ${gain ? 'text-ember' : 'text-frost'}`}
        >
          {gain ? 'ganas ' : 'pierdes '}
          {formatMoney(Math.abs(sim.profit), sim.currency)}
        </p>

        <dl className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-4">
          <div>
            <dt className="text-sm text-ash">{sim.symbol} ese día</dt>
            <dd className="num mt-1 font-display text-2xl font-semibold text-frost">
              {formatPct(sim.marketVariationPct)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Apalancamiento</dt>
            <dd className="num mt-1 font-display text-2xl font-semibold">× {sim.leverage}</dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Tu retorno</dt>
            <dd
              className={`num mt-1 font-display text-2xl font-semibold ${gain ? 'text-ember' : 'text-frost'}`}
            >
              {formatPct(sim.returnPct)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ash">Valor final</dt>
            <dd className="num mt-1 font-display text-2xl font-semibold">
              {formatMoney(sim.finalAmount, sim.currency)}
            </dd>
            <dd className="num text-sm text-ash">{formatSignedMoney(sim.profit, sim.currency)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs text-ash">Simulación hecha el {formatDateTime(sim.createdAt)}</p>
      </section>

      <div className="mt-6">
        <AlertCard simulationId={sim.id} />
      </div>
    </>
  );
}
