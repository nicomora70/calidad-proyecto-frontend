import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { Branding, DailySentiment, Page, Simulation, User } from '../types/api';
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
  alerts: ['me', 'alerts'] as const,
  preferences: ['me', 'notification-preferences'] as const,
  sentiment: ['news', 'sentiment'] as const,
};

export function useMySimulations(page: number, filter: DateFilter = {}, size = 10) {
  return useQuery({
    queryKey: keys.mySimulations(page, filter),
    queryFn: ({ signal }) =>
      api<Page<Simulation>>('/api/v1/me/simulations', {
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
      api<{ count: number }>('/api/v1/me/notifications/unread-count', { signal }),
    refetchInterval: 60_000,
    select: (d) => d.count,
  });
}

export function useDailySentiment() {
  return useQuery({
    queryKey: keys.sentiment,
    queryFn: ({ signal }) => api<DailySentiment>('/api/v1/news/sentiment', { signal }),
    staleTime: 5 * 60_000,
  });
}

/** Branding de la instalación (público: también sirve antes de ingresar). */
export function useBranding() {
  return useQuery({
    queryKey: ['branding'],
    queryFn: ({ signal }) => api<Branding>('/api/v1/settings/branding', { auth: false, signal }),
    staleTime: 10 * 60_000,
  });
}

/** Usuarios para filtros y para poner nombre a los IDs (solo ADMIN puede listarlos). */
export function useUserDirectory(enabled = true) {
  return useQuery({
    queryKey: ['users', 'directory'],
    queryFn: ({ signal }) =>
      api<Page<User>>('/api/v1/users', { query: { size: 200, sort: 'fullName,asc' }, signal }),
    enabled,
    staleTime: 5 * 60_000,
    select: (p) => ({
      list: p.content,
      byId: new Map(p.content.map((u) => [u.id, u])),
    }),
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
