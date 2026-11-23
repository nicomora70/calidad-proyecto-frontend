import { useDailySentiment, sentimentText } from '../../lib/queries';
import { formatDay } from '../../lib/format';
import type { DailySentiment } from '../../types/api';
import { Card, CardTitle, ErrorState, Skeleton } from '../ui/Surface';

/** Ánimo del mercado del día: etiqueta + barra apilada alcistas / neutrales / bajistas. */
export function SentimentCard({ className = '' }: { className?: string }) {
  const { data, isPending, isError, error, refetch } = useDailySentiment();

  return (
    <Card className={className}>
      <CardTitle>Ánimo del mercado hoy</CardTitle>
      {isPending ? (
        <Skeleton className="h-20" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : !data.sentiment || data.sentiment.count === 0 ? (
        <p className="text-sm text-ash">Aún no hay noticias analizadas para hoy.</p>
      ) : (
        <SentimentBody s={data.sentiment} date={data.date} />
      )}
    </Card>
  );
}

function SentimentBody({ s, date }: { s: NonNullable<DailySentiment['sentiment']>; date: string }) {
  const parts = [
    { key: 'bull', label: 'Alcistas', n: s.bullishCount, cls: 'bg-series-x2' },
    { key: 'neutral', label: 'Neutrales', n: s.neutralCount, cls: 'bg-ash/50' },
    { key: 'bear', label: 'Bajistas', n: s.bearishCount, cls: 'bg-series-index' },
  ];
  const total = parts.reduce((a, p) => a + p.n, 0) || 1;

  return (
    <>
      <p className="font-display text-3xl font-bold">{sentimentText(s.label)}</p>
      <p className="num text-sm text-ash">
        {s.count} noticias del {formatDay(date)}, puntaje medio{' '}
        {s.meanScore.toFixed(2).replace('.', ',')}
      </p>
      <div
        className="mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((p) => `${p.label}: ${p.n}`).join(', ')}
      >
        {parts
          .filter((p) => p.n > 0)
          .map((p) => (
            <div
              key={p.key}
              className={p.cls}
              style={{ width: `${(p.n / total) * 100}%` }}
              title={`${p.label}: ${p.n}`}
            />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${p.cls}`} aria-hidden />
            <span className="text-ash">{p.label}</span>
            <span className="num font-medium">{p.n}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
