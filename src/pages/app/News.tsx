import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/app/AppShell';
import { DateRange } from '../../components/app/DateRange';
import { SentimentCard } from '../../components/app/SentimentCard';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Field';
import {
  Card,
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
  selectClass,
} from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { errorMessage } from '../../lib/errors';
import { formatDateTime } from '../../lib/format';
import { SENTIMENT_LABEL, sentimentText, type DateFilter } from '../../lib/queries';
import type { NewsArticle, Page } from '../../types/api';

function sentimentTone(label: string | null) {
  if (!label) return 'text-ash';
  if (label.includes('Bullish')) return 'text-ember';
  if (label.includes('Bearish')) return 'text-frost';
  return 'text-ash';
}

export default function News() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<DateFilter>({});
  const [sentiment, setSentiment] = useState('');

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['news', page, filter, sentiment],
    queryFn: ({ signal }) =>
      api<Page<NewsArticle>>('/api/news', {
        query: { page, size: 12, from: filter.from, to: filter.to, sentiment },
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const refresh = useMutation({
    mutationFn: () => api('/api/news/refresh', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast('Noticias actualizadas');
    },
    onError: (err) => toast(errorMessage(err), 'error'),
  });

  return (
    <>
      <PageHeader
        title="Noticias"
        description="Titulares del NASDAQ 100 y el ánimo del mercado que reflejan."
        actions={
          hasRole('ADMIN') && (
            <Button variant="ghost" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
              {refresh.isPending ? <Spinner /> : <RefreshCw size={16} />}
              Actualizar noticias
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end gap-2">
            <DateRange
              value={filter}
              onChange={(f) => {
                setFilter(f);
                setPage(0);
              }}
            />
            <label className="text-sm">
              <span className="mb-1 block text-ash">Ánimo</span>
              <select
                className={selectClass}
                value={sentiment}
                onChange={(e) => {
                  setSentiment(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">Todos</option>
                {Object.entries(SENTIMENT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : isError ? (
            <Card>
              <ErrorState error={error} onRetry={() => refetch()} />
            </Card>
          ) : data.content.length === 0 ? (
            <Card>
              <EmptyState
                title="No hay noticias con esos filtros"
                text="Prueba con otras fechas o con otro ánimo."
              />
            </Card>
          ) : (
            <>
              <ul className="space-y-3">
                {data.content.map((n) => (
                  <li key={n.id}>
                    <article className="rounded-card border border-line bg-surface p-5 transition-colors hover:border-ember/40">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ash">
                        <span>{n.source ?? 'Fuente desconocida'}</span>
                        <time dateTime={n.publishedAt}>{formatDateTime(n.publishedAt)}</time>
                        <span className={`font-medium ${sentimentTone(n.sentimentLabel)}`}>
                          {sentimentText(n.sentimentLabel)}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-lg leading-snug font-semibold">
                        <a
                          href={n.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-ember"
                        >
                          {n.title}
                          <ExternalLink
                            size={14}
                            className="ml-1.5 inline text-ash"
                            aria-label="(abre en otra pestaña)"
                          />
                        </a>
                      </h2>
                      {n.summary && (
                        <p className="mt-2 line-clamp-3 max-w-[72ch] text-sm text-ash">
                          {n.summary}
                        </p>
                      )}
                    </article>
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={data.page.totalPages} onChange={setPage} />
            </>
          )}
        </div>
        <SentimentCard className="self-start lg:sticky lg:top-24" />
      </div>
    </>
  );
}
