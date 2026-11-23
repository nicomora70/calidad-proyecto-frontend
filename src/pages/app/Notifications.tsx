import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckCheck,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { Button } from '../../components/ui/Button';
import { FormError, Spinner } from '../../components/ui/Field';
import {
  Card,
  CardTitle,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { keys } from '../../lib/queries';
import type {
  AppNotification,
  NotificationPreferences,
  NotificationType,
  Page,
} from '../../types/api';

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  AI_ALERT_READY: Sparkles,
  MARKET_VARIATION: TrendingUp,
  SECURITY_EVENT: ShieldAlert,
  LICENSE_EXPIRING: CalendarClock,
};

function Inbox() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [unread, setUnread] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [...keys.notifications, unread, page],
    queryFn: ({ signal }) =>
      api<Page<AppNotification>>('/api/v1/me/notifications', {
        query: { unread, page, size: 15 },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: keys.notifications });

  const markRead = useMutation({
    mutationFn: (id: string) => api(`/api/v1/me/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: invalidate,
  });
  const markAll = useMutation({
    mutationFn: () =>
      api<{ updated: number }>('/api/v1/me/notifications/read-all', { method: 'POST' }),
    onSuccess: (r) => {
      invalidate();
      toast(
        r.updated === 1
          ? '1 notificación marcada como leída'
          : `${r.updated} notificaciones marcadas como leídas`,
      );
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filtro"
          className="flex gap-1 rounded-ctrl border border-line p-1"
        >
          {[
            { v: false, label: 'Todas' },
            { v: true, label: 'Sin leer' },
          ].map((t) => (
            <button
              key={t.label}
              role="tab"
              type="button"
              aria-selected={unread === t.v}
              onClick={() => {
                setUnread(t.v);
                setPage(0);
              }}
              className={`rounded-[7px] px-3.5 py-1.5 text-sm ${unread === t.v ? 'bg-surface-2 font-semibold' : 'text-ash hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="h-10"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending}
        >
          {markAll.isPending ? <Spinner /> : <CheckCheck size={16} />}
          Marcar todas como leídas
        </Button>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : data.content.length === 0 ? (
        <EmptyState
          title={unread ? 'Estás al día' : 'No tienes notificaciones'}
          text="Te avisaremos cuando tu alerta con IA esté lista o el mercado se mueva más de tu umbral."
        />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {data.content.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Sparkles;
              const isUnread = !n.readAt;
              return (
                <li key={n.id} className="flex gap-4 py-4">
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${
                      n.type === 'SECURITY_EVENT'
                        ? 'bg-frost/15 text-frost'
                        : 'bg-ember/12 text-ember'
                    }`}
                  >
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`${isUnread ? 'font-semibold' : 'font-medium text-ash'}`}>
                      {isUnread && <span className="sr-only">Sin leer: </span>}
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-sm text-ash">{n.body}</p>
                    <p className="mt-1 text-xs text-ash">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => markRead.mutate(n.id)}
                      disabled={markRead.isPending && markRead.variables === n.id}
                      className="h-8 shrink-0 self-center rounded-ctrl px-2.5 text-xs text-ash hover:bg-surface-2 hover:text-ink"
                    >
                      Marcar como leída
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
        </>
      )}
    </Card>
  );
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-ash">{hint}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="relative h-6 w-10 shrink-0 rounded-full bg-surface-2 transition-colors peer-checked:bg-ember peer-focus-visible:ring-2 peer-focus-visible:ring-ember peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface after:absolute after:top-1 after:left-1 after:size-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

function Preferences() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: keys.preferences,
    queryFn: ({ signal }) =>
      api<NotificationPreferences>('/api/v1/me/notification-preferences', { signal }),
  });

  return (
    <Card className="self-start">
      <CardTitle>Preferencias</CardTitle>
      {isPending ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <PreferencesForm initial={data} />
      )}
    </Card>
  );
}

function PreferencesForm({ initial: data }: { initial: NotificationPreferences }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    emailEnabled: data.emailEnabled,
    inAppEnabled: data.inAppEnabled,
    threshold: String(data.variationThresholdPct).replace('.', ','),
  });
  const [thresholdError, setThresholdError] = useState<string>();

  const save = useMutation({
    mutationFn: (body: {
      emailEnabled: boolean;
      inAppEnabled: boolean;
      variationThresholdPct: number;
    }) =>
      api<NotificationPreferences>('/api/v1/me/notification-preferences', { method: 'PUT', body }),
    onSuccess: (saved) => {
      queryClient.setQueryData(keys.preferences, saved);
      toast('Preferencias guardadas');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const value = Number(form.threshold.replace(',', '.'));
    if (!Number.isFinite(value) || value < 0.1 || value > 100) {
      setThresholdError('Usa un valor entre 0,1 y 100.');
      return;
    }
    setThresholdError(undefined);
    save.mutate({
      emailEnabled: form.emailEnabled,
      inAppEnabled: form.inAppEnabled,
      variationThresholdPct: Math.round(value * 100) / 100,
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Toggle
        label="En la aplicación"
        checked={form.inAppEnabled}
        onChange={(v) => setForm({ ...form, inAppEnabled: v })}
      />
      <Toggle
        label="Por correo"
        hint={
          data.emailAvailable ? undefined : 'El correo no está configurado en esta instalación.'
        }
        checked={form.emailEnabled && data.emailAvailable}
        disabled={!data.emailAvailable}
        onChange={(v) => setForm({ ...form, emailEnabled: v })}
      />
      <div>
        <label htmlFor="threshold" className="mb-1.5 block text-sm font-medium">
          Avísame si el índice se mueve más de
        </label>
        <div className="relative">
          <input
            id="threshold"
            inputMode="decimal"
            value={form.threshold}
            onChange={(e) =>
              setForm({ ...form, threshold: e.target.value.replace(/[^\d.,]/g, '') })
            }
            aria-invalid={!!thresholdError}
            className="num h-11 w-full rounded-ctrl border border-line bg-bg px-3.5 pr-10 focus:border-ember focus:outline-none aria-[invalid=true]:border-frost"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-ash">
            %
          </span>
        </div>
        <p className={`mt-1.5 text-xs ${thresholdError ? 'text-frost' : 'text-ash'}`}>
          {thresholdError ?? 'En un día, hacia arriba o hacia abajo.'}
        </p>
      </div>
      <FormError message={save.isError ? errorMessage(save.error) : null} />
      <Button type="submit" className="w-full" disabled={save.isPending}>
        {save.isPending && <Spinner />}
        Guardar preferencias
      </Button>
    </form>
  );
}

export default function Notifications() {
  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Avisos sobre tus alertas, el mercado y la seguridad de tu cuenta."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Inbox />
        <Preferences />
      </div>
    </>
  );
}
