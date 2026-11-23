import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { DailySentiment, Page, Simulation } from '../types/api';
import { api } from './api';

export interface DateFilter {
  from?: string;
  to?: string;
}

export const keys = {
  mySimulations: (page: number, f: DateFilter) => ['me', 'simulations', page, f] as const,
  simulation: (id: string) => ['simulation', id] as const,
  alert: (id: string) => ['simulation', id, 'alert'] as const,
  unread: ['me', 'notifications', 'unread'] as const,
  notifications: ['me', 'notifications'] as const,
  preferences: ['me', 'notification-preferences'] as const,
  sentiment: ['news', 'sentiment'] as const,
};

export function useMySimulations(page: number, filter: DateFilter = {}, size = 10) {
  return useQuery({
    queryKey: keys.mySimulations(page, filter),
    queryFn: ({ signal }) =>
      api<Page<Simulation>>('/api/me/simulations', {
        query: { page, size, from: filter.from, to: filter.to },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: ({ signal }) =>
      api<{ count: number }>('/api/me/notifications/unread-count', { signal }),
    refetchInterval: 60_000,
    select: (d) => d.count,
  });
}

export function useDailySentiment() {
  return useQuery({
    queryKey: keys.sentiment,
    queryFn: ({ signal }) => api<DailySentiment>('/api/news/sentiment', { signal }),
    staleTime: 5 * 60_000,
  });
}

/** Etiquetas de sentimiento de Alpha Vantage en lenguaje claro. */
export const SENTIMENT_LABEL: Record<string, string> = {
  Bullish: 'Alcista',
  'Somewhat-Bullish': 'Algo alcista',
  Neutral: 'Neutral',
  'Somewhat-Bearish': 'Algo bajista',
  Bearish: 'Bajista',
};

export const sentimentText = (label: string | null | undefined) =>
  label ? (SENTIMENT_LABEL[label] ?? label) : 'Sin dato';
