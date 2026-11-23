import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { CapitalInput } from '../../components/app/CapitalInput';
import { Button } from '../../components/ui/Button';
import { FormError, Spinner } from '../../components/ui/Field';
import { Card, CardTitle, Signed } from '../../components/ui/Surface';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import { formatDay, formatMoney, formatPct, formatSignedMoney } from '../../lib/format';
import type { ProjectionResponse, Scenario } from '../../types/api';

const HORIZONS = [
  { days: 21, label: '1 mes' },
  { days: 63, label: '3 meses' },
  { days: 126, label: '6 meses' },
  { days: 252, label: '1 año' },
];

/** Banda P10–P90 con la mediana y el capital inicial como referencia, etiquetada directamente. */
function RangeBand({
  capital,
  r,
  currency,
}: {
  capital: number;
  r: ProjectionResponse['projection']['result'];
  currency: string;
}) {
  const values = [capital, r.pessimistic.finalAmount, r.optimistic.finalAmount];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.08 || 1;
  const pos = (v: number) => ((v - (min - pad)) / (max - min + 2 * pad)) * 100;

  const marks = [
    { v: r.pessimistic.finalAmount, label: 'Pesimista', row: 0 },
    { v: r.base.finalAmount, label: 'Base', row: 1 },
    { v: r.optimistic.finalAmount, label: 'Optimista', row: 0 },
  ];

  return (
    <figure className="mt-2">
      <div className="relative h-44">
        <div className="absolute inset-x-0 top-14 h-px bg-line" />
        <div
          className="absolute top-10 h-8 rounded-[4px] bg-series-x2/25"
          style={{
            left: `${pos(r.pessimistic.finalAmount)}%`,
            width: `${pos(r.optimistic.finalAmount) - pos(r.pessimistic.finalAmount)}%`,
          }}
        />
        <div className="absolute top-6 h-16 w-0.5 bg-ash" style={{ left: `${pos(capital)}%` }} />
        <span
          className="absolute top-0 -translate-x-1/2 text-xs whitespace-nowrap text-ash"
          style={{ left: `${pos(capital)}%` }}
        >
          Hoy
        </span>
        {marks.map((m) => (
          <div key={m.label} className="absolute top-10" style={{ left: `${pos(m.v)}%` }}>
            <div
              className={`-translate-x-1/2 ${m.label === 'Base' ? 'h-8 w-1 bg-series-x2' : 'h-8 w-0.5 bg-series-x2/70'}`}
            />
            <div
              className={`absolute -translate-x-1/2 text-center whitespace-nowrap ${m.row ? 'top-20' : 'top-11'}`}
            >
              <p className="text-xs text-ash">{m.label}</p>
              <p className="num text-sm font-semibold">{formatMoney(m.v, currency)}</p>
            </div>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">
        Rango del 10 % al 90 % de los resultados simulados: de{' '}
        {formatMoney(r.pessimistic.finalAmount, currency)} a{' '}
        {formatMoney(r.optimistic.finalAmount, currency)}, con un escenario base de{' '}
        {formatMoney(r.base.finalAmount, currency)}.
      </figcaption>
    </figure>
  );
}

function ScenarioTile({
  name,
  hint,
  s,
  currency,
}: {
  name: string;
  hint: string;
  s: Scenario;
  currency: string;
}) {
  return (
    <div className="rounded-card border border-line p-5">
      <p className="font-medium">{name}</p>
      <p className="text-xs text-ash">{hint}</p>
      <p className="num mt-4 font-display text-2xl font-bold">
        {formatMoney(s.finalAmount, currency)}
      </p>
      <p className="mt-1 text-sm">
        <Signed value={s.profit}>
          {formatSignedMoney(s.profit, currency)} ({formatPct(s.returnPct)})
        </Signed>
      </p>
    </div>
  );
}

export default function Projections() {
  const [capital, setCapital] = useState('');
  const [days, setDays] = useState(63);
  const [fieldError, setFieldError] = useState<string>();

  const project = useMutation({
    mutationFn: (body: { initialCapital: number; horizonDays: number }) =>
      api<ProjectionResponse>('/api/projections', { method: 'POST', body }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!capital || Number(capital) <= 0) {
      setFieldError('Escribe un capital mayor que cero.');
      return;
    }
    setFieldError(undefined);
    project.mutate({ initialCapital: Number(capital), horizonDays: days });
  }

  const data = project.data;
  const result = data?.projection.result;
  const currency = data?.projection.currency ?? 'COP';
  const submittedCapital = project.variables?.initialCapital ?? 0;

  return (
    <>
      <PageHeader
        title="Proyecciones"
        description="Miles de escenarios a partir del comportamiento histórico del índice, con el apalancamiento x2."
      />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="self-start">
          <form onSubmit={onSubmit} noValidate className="space-y-5">
            <CapitalInput value={capital} onChange={setCapital} error={fieldError} />
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">Horizonte</legend>
              <div className="grid grid-cols-4 gap-1 rounded-ctrl border border-line p-1">
                {HORIZONS.map((h) => (
                  <label
                    key={h.days}
                    className={`cursor-pointer rounded-[7px] py-2 text-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ember ${
                      days === h.days
                        ? 'bg-ember text-on-ember font-semibold'
                        : 'text-ash hover:text-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name="horizon"
                      className="sr-only"
                      checked={days === h.days}
                      onChange={() => setDays(h.days)}
                    />
                    {h.label}
                  </label>
                ))}
              </div>
              <p className="num mt-1.5 text-xs text-ash">{days} días de mercado</p>
            </fieldset>
            <Button type="submit" className="w-full" disabled={project.isPending}>
              {project.isPending && <Spinner />}
              {project.isPending ? 'Proyectando' : 'Proyectar'}
            </Button>
            <FormError message={project.isError ? errorMessage(project.error) : null} />
          </form>
        </Card>

        <Card>
          {!result ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <p className="font-medium">Tu proyección aparecerá aquí</p>
              <p className="mt-1 max-w-[40ch] text-sm text-ash">
                Escribe un capital, elige un horizonte y pulsa Proyectar.
              </p>
            </div>
          ) : (
            <>
              <CardTitle>
                En {result.horizonDays} días, con {formatMoney(submittedCapital, currency)}
              </CardTitle>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-ash">Probabilidad de perder dinero</p>
                  <p className="num font-display text-4xl font-extrabold">
                    {formatPct(result.probabilityOfLossPct).replace('+', '')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ash">Valor final esperado</p>
                  <p className="num font-display text-4xl font-extrabold">
                    {formatMoney(result.expectedFinalAmount, currency)}
                  </p>
                </div>
              </div>

              <RangeBand capital={submittedCapital} r={result} currency={currency} />

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ScenarioTile
                  name="Pesimista"
                  hint="9 de cada 10 escenarios terminan mejor"
                  s={result.pessimistic}
                  currency={currency}
                />
                <ScenarioTile
                  name="Base"
                  hint="La mitad termina por encima, la mitad por debajo"
                  s={result.base}
                  currency={currency}
                />
                <ScenarioTile
                  name="Optimista"
                  hint="Solo 1 de cada 10 escenarios termina mejor"
                  s={result.optimistic}
                  currency={currency}
                />
              </div>

              <p className="mt-6 text-xs text-ash">
                {result.simulations.toLocaleString('es-CO')} escenarios con {result.sampleSize} días
                de historia ({formatDay(data.projection.historyFrom)} a{' '}
                {formatDay(data.projection.historyTo)}). {data.disclaimer}.
              </p>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
