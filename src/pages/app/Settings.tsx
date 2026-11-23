import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { Button } from '../../components/ui/Button';
import { Field, FormError, Spinner } from '../../components/ui/Field';
import { Card, CardTitle, ErrorState, Skeleton } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { ApiError, errorMessage } from '../../lib/errors';
import { formatDay } from '../../lib/format';
import { useBranding } from '../../lib/queries';
import type { Branding, LicenseState, LicenseStatus } from '../../types/api';

const STATE: Record<LicenseState, { label: string; tone: string; text: string }> = {
  ACTIVE: {
    label: 'Vigente',
    tone: 'bg-ember',
    text: 'La instalación tiene todos sus módulos habilitados.',
  },
  EXPIRING: {
    label: 'Por vencer',
    tone: 'bg-flare',
    text: 'Renueva la licencia antes de la fecha de vencimiento.',
  },
  EXPIRED: {
    label: 'Vencida',
    tone: 'bg-frost',
    text: 'Los módulos de la licencia están bloqueados hasta instalar una nueva.',
  },
  MISSING: {
    label: 'Sin licencia',
    tone: 'bg-frost',
    text: 'Instala el archivo de licencia que te entregó RiTech.',
  },
  DISABLED: {
    label: 'Verificación desactivada',
    tone: 'bg-ash',
    text: 'Modo de desarrollo o demostración: no se verifica la licencia.',
  },
};

const MODULES: Record<string, string> = {
  SIMULATIONS: 'Simulaciones',
  DASHBOARD: 'Panel',
  AI_ALERTS: 'Alertas con IA',
  NEWS: 'Noticias',
  NOTIFICATIONS: 'Notificaciones',
  EXPORTS: 'Exportes',
  PROJECTIONS: 'Proyecciones',
};

const PLAN: Record<string, string> = {
  BASIC: 'Básico',
  PROFESSIONAL: 'Profesional',
  ENTERPRISE: 'Empresarial',
};

function License() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['license'],
    queryFn: ({ signal }) => api<LicenseStatus>('/api/v1/license', { signal }),
  });

  const install = useMutation({
    mutationFn: (file: { format: string; payload: string; signature: string }) =>
      api<LicenseStatus>('/api/v1/license', { method: 'POST', body: file }),
    onSuccess: (status) => {
      queryClient.setQueryData(['license'], status);
      toast('Licencia instalada');
    },
  });

  async function onFile(file: File | undefined) {
    setFileError(null);
    install.reset();
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      const { format, payload, signature } = parsed;
      if (
        typeof format !== 'string' ||
        typeof payload !== 'string' ||
        typeof signature !== 'string'
      ) {
        throw new Error('shape');
      }
      install.mutate({ format, payload, signature });
    } catch {
      setFileError('El archivo no tiene el formato de una licencia de RiTech (license.json).');
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <Card>
      <CardTitle>Licencia</CardTitle>
      {isPending ? (
        <Skeleton className="h-48" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <>
          <div className="flex items-center gap-2.5">
            <span className={`size-2.5 rounded-full ${STATE[data.state].tone}`} aria-hidden />
            <p className="font-display text-2xl font-bold">{STATE[data.state].label}</p>
          </div>
          <p className="mt-1 text-sm text-ash">{STATE[data.state].text}</p>

          {data.licenseId && (
            <dl className="mt-6 grid gap-5 border-t border-line pt-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ash">Empresa</dt>
                <dd className="mt-0.5 font-medium">{data.company ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-ash">Plan</dt>
                <dd className="mt-0.5 font-medium">{data.plan ? PLAN[data.plan] : '—'}</dd>
              </div>
              <div>
                <dt className="text-ash">Vence</dt>
                <dd className="mt-0.5 font-medium">
                  {data.expiresAt ? formatDay(data.expiresAt) : '—'}
                  {data.daysRemaining != null && data.daysRemaining >= 0 && (
                    <span className="num ml-1.5 text-ash">
                      (
                      {data.daysRemaining === 1
                        ? 'queda 1 día'
                        : `quedan ${data.daysRemaining} días`}
                      )
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ash">Usuarios activos</dt>
                <dd className="num mt-0.5 font-medium">
                  {data.activeUsers}
                  {data.maxUsers != null && ` de ${data.maxUsers}`}
                </dd>
                {data.maxUsers != null && data.maxUsers > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div
                      className={`h-full rounded-full ${data.activeUsers >= data.maxUsers ? 'bg-frost' : 'bg-ember'}`}
                      style={{
                        width: `${Math.min(100, (data.activeUsers / data.maxUsers) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
              {data.modules && (
                <div className="sm:col-span-2">
                  <dt className="text-ash">Módulos incluidos</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {data.modules.map((m) => (
                      <span
                        key={m}
                        className="rounded-full border border-line px-2.5 py-0.5 text-xs"
                      >
                        {MODULES[m] ?? m}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-6 border-t border-line pt-5">
            <input
              ref={fileInput}
              id={inputId}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <label
              htmlFor={inputId}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-ctrl border border-line px-5 text-sm font-semibold hover:bg-surface-2"
            >
              {install.isPending ? <Spinner /> : <FileUp size={16} />}
              {data.licenseId ? 'Renovar licencia' : 'Instalar licencia'}
            </label>
            <p className="mt-2 text-xs text-ash">
              Sube el archivo license.json que te entregó RiTech.
            </p>
            <div className="mt-3">
              <FormError
                message={fileError ?? (install.isError ? errorMessage(install.error) : null)}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

const HEX = /^#[0-9A-Fa-f]{6}$/;

function BrandingForm({ initial }: { initial: Branding }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState({
    productName: initial.productName ?? '',
    companyName: initial.companyName ?? '',
    primaryColor: initial.primaryColor ?? '',
    logoUrl: initial.logoUrl ?? '',
    legalNotice: initial.legalNotice ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => api<Branding>('/api/v1/settings/branding', { method: 'PUT', body: form }),
    onSuccess: (b) => {
      queryClient.setQueryData(['branding'], b);
      toast('Branding guardado');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR') setErrors(err.fieldErrors);
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (form.primaryColor && !HEX.test(form.primaryColor))
      v.primaryColor = 'Usa el formato #RRGGBB.';
    if (form.logoUrl && !/^https:\/\/\S+$/.test(form.logoUrl))
      v.logoUrl = 'Debe ser una dirección https://';
    setErrors(v);
    if (!Object.keys(v).length) save.mutate();
  }

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nombre del producto"
          value={form.productName}
          maxLength={60}
          onChange={set('productName')}
          error={errors.productName}
          hint="Se muestra en la barra lateral."
        />
        <Field
          label="Empresa"
          value={form.companyName}
          maxLength={150}
          onChange={set('companyName')}
          error={errors.companyName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <Field
          label="Logo (URL https)"
          value={form.logoUrl}
          maxLength={500}
          placeholder="https://empresa.com/logo.svg"
          onChange={set('logoUrl')}
          error={errors.logoUrl}
        />
        <div>
          <label htmlFor="brand-color" className="mb-1.5 block text-sm font-medium">
            Color de marca
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label="Elegir color"
              value={HEX.test(form.primaryColor) ? form.primaryColor : '#000000'}
              onChange={set('primaryColor')}
              className="h-11 w-12 cursor-pointer rounded-ctrl border border-line bg-bg p-1"
            />
            <input
              id="brand-color"
              value={form.primaryColor}
              maxLength={7}
              onChange={set('primaryColor')}
              aria-invalid={!!errors.primaryColor}
              className="num h-11 w-28 rounded-ctrl border border-line bg-bg px-3 text-sm uppercase focus:border-ember focus:outline-none aria-[invalid=true]:border-frost"
            />
          </div>
          {errors.primaryColor ? (
            <p className="mt-1.5 text-sm text-frost">{errors.primaryColor}</p>
          ) : (
            <p className="mt-1.5 max-w-[24ch] text-xs text-ash">La interfaz conserva su paleta.</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="brand-legal" className="mb-1.5 block text-sm font-medium">
          Aviso legal
        </label>
        <textarea
          id="brand-legal"
          rows={3}
          maxLength={1000}
          value={form.legalNotice}
          onChange={set('legalNotice')}
          className="w-full rounded-ctrl border border-line bg-bg px-3.5 py-2.5 text-sm focus:border-ember focus:outline-none"
        />
        <p className="num mt-1 text-right text-xs text-ash">{form.legalNotice.length} / 1000</p>
      </div>
      <p className="text-xs text-ash">Los campos que dejes vacíos vuelven al valor por defecto.</p>
      <FormError message={save.isError ? errorMessage(save.error) : null} />
      <Button type="submit" disabled={save.isPending}>
        {save.isPending && <Spinner />}
        Guardar branding
      </Button>
    </form>
  );
}

function BrandingCard() {
  const { data, isPending, isError, error, refetch } = useBranding();
  return (
    <Card>
      <CardTitle>Branding</CardTitle>
      {isPending ? (
        <Skeleton className="h-64" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <BrandingForm initial={data} />
      )}
    </Card>
  );
}

export default function Settings() {
  const { hasRole } = useAuth();
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Licencia de la instalación e identidad de la empresa."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <License />
        {hasRole('ADMIN') && <BrandingCard />}
      </div>
    </>
  );
}
