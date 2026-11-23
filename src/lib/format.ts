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

const dateTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const date = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

export const formatCop = (n: number) => cop.format(n);
export const formatPct = (n: number) => `${pct.format(n)} %`;
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => date.format(new Date(iso));
