const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const pct = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 1,
  signDisplay: 'exceptZero',
});

const dateTime = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});
const date = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDay = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' });

export const formatCop = (n: number) => cop.format(n);

const moneyFormats = new Map<string, Intl.NumberFormat>();
/** Moneda que devuelve la API (por defecto COP), sin decimales para cifras grandes. */
export function formatMoney(n: number, currency = 'COP') {
  let f = moneyFormats.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 });
    } catch {
      f = cop;
    }
    moneyFormats.set(currency, f);
  }
  return f.format(n);
}

export const formatSignedMoney = (n: number, currency?: string) =>
  `${n > 0 ? '+' : n < 0 ? '−' : ''}${formatMoney(Math.abs(n), currency)}`;
export const formatPct = (n: number) => `${pct.format(n)}\u00a0%`;
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => date.format(new Date(iso));

/** Fecha sin hora (LocalDate "yyyy-mm-dd"): se interpreta en hora local, no en UTC. */
function localDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}
export const formatDay = (day: string) => date.format(localDay(day));
/** Día y mes, para ejes de gráficas. */
export const formatShortDay = (day: string) => shortDay.format(localDay(day));
