import { Bell, Plus, ScrollText, ShieldCheck } from 'lucide-react';
import { lazy, Suspense, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/app/AppShell';
import { SentimentCard } from '../../components/app/SentimentCard';
import { ButtonLink } from '../../components/ui/Button';
import {
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Signed,
  Skeleton,
} from '../../components/ui/Surface';
import { ROLE_LABEL, useAuth } from '../../lib/auth';
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatPct,
  formatSignedMoney,
} from '../../lib/format';
import { useMySimulations, useUnreadCount } from '../../lib/queries';

const RECENT = 12;

// Recharts pesa ~300 kB: se carga aparte para que las cifras aparezcan sin esperar la gráfica.
const ReturnsChart = lazy(() =>
  import('../../components/app/ReturnsChart').then((m) => ({ default: m.ReturnsChart })),
);

function Stat({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
      <p className="text-sm text-ash">{label}</p>
      <p className="num mt-2 font-display text-3xl font-extrabold">{children}</p>
      {note && <p className="mt-1 text-xs text-ash">{note}</p>}
    </div>
  );
}

function InvestorHome() {
  const { data, isPending, isError, error, refetch } = useMySimulations(0, {}, RECENT);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
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

  const sims = data.content;
  if (sims.length === 0) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <EmptyState
            title="Haz tu primera simulación"
            text="Escribe un capital y te mostramos cuánto habrías ganado o perdido con el último movimiento del NASDAQ 100 multiplicado por dos."
            action={<ButtonLink to="/app/simulaciones">Simular ahora</ButtonLink>}
          />
        </Card>
        <SentimentCard className="self-start" />
      </div>
    );
  }

  const last = sims[0]!;
  const total = sims.reduce((acc, s) => acc + s.profit, 0);
  const currency = last.currency;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Última simulación" note={formatDateTime(last.createdAt)}>
          <Signed value={last.profit}>{formatSignedMoney(last.profit, currency)}</Signed>
        </Stat>
        <Stat
          label="Tu último retorno"
          note={`El índice se movió ${formatPct(last.marketVariationPct)}`}
        >
          <Signed value={last.returnPct}>{formatPct(last.returnPct)}</Signed>
        </Stat>
        <Stat
          label="Resultado acumulado"
          note={
            sims.length < data.page.totalElements
              ? `En tus últimas ${sims.length} de ${data.page.totalElements}`
              : `En tus ${sims.length} simulaciones`
          }
        >
          <Signed value={total}>{formatSignedMoney(total, currency)}</Signed>
        </Stat>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="min-w-0 self-start">
          <CardTitle
            action={
              <Link
                to="/app/simulaciones"
                className="text-sm whitespace-nowrap text-ash hover:text-ink"
              >
                Ver historial
              </Link>
            }
          >
            El índice frente a tu retorno
          </CardTitle>
          <Suspense fallback={<Skeleton className="h-72" />}>
            <ReturnsChart simulations={sims} />
          </Suspense>
        </Card>
        <div className="space-y-6">
          <SentimentCard />
          <Card>
            <CardTitle>Recientes</CardTitle>
            <ul className="divide-y divide-line text-sm">
              {sims.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link
                    to={`/app/simulaciones/${s.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 hover:text-ember"
                  >
                    <span>
                      <span className="num block font-medium">
                        {formatMoney(s.initialCapital, s.currency)}
                      </span>
                      <span className="block text-xs text-ash">{formatDate(s.createdAt)}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap">
                      <Signed value={s.profit}>{formatSignedMoney(s.profit, s.currency)}</Signed>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** "Gerente de TI" → "gerente de TI": solo la primera letra, para no romper siglas. */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function StaffHome() {
  const { data: unread } = useUnreadCount();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardTitle>Tus herramientas</CardTitle>
        <div className="flex flex-wrap gap-2">
          <ButtonLink to="/app/auditoria" variant="ghost">
            <ScrollText size={16} /> Revisar la auditoría
          </ButtonLink>
          <ButtonLink to="/app/configuracion" variant="ghost">
            <ShieldCheck size={16} /> Ver la licencia
          </ButtonLink>
        </div>
      </Card>
      <SentimentCard />
      <Card>
        <CardTitle>Notificaciones</CardTitle>
        <p className="num font-display text-3xl font-extrabold">{unread ?? '–'}</p>
        <p className="text-sm text-ash">sin leer</p>
        <ButtonLink to="/app/notificaciones" variant="ghost" className="mt-5">
          <Bell size={16} /> Ver notificaciones
        </ButtonLink>
      </Card>
    </div>
  );
}

export default function Home() {
  const { user, hasRole } = useAuth();
  if (!user) return null;
  const canSimulate = hasRole('INVESTOR', 'ADMIN');
  return (
    <>
      <PageHeader
        title={`Hola, ${user.fullName.split(' ')[0]}`}
        description={`Ingresaste como ${lowerFirst(ROLE_LABEL[user.role])}.`}
        actions={
          canSimulate && (
            <ButtonLink to="/app/simulaciones">
              <Plus size={16} /> Nueva simulación
            </ButtonLink>
          )
        }
      />
      {canSimulate ? <InvestorHome /> : <StaffHome />}
    </>
  );
}
