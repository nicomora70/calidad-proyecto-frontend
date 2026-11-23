export type Role = 'ADMIN' | 'IT_MANAGER' | 'INVESTOR';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: User;
}

/** Página de Spring Data serializada VIA_DTO. */
export interface Page<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface Simulation {
  id: string;
  userId: string;
  initialCapital: number;
  currency: string;
  symbol: string;
  marketDate: string;
  marketVariationPct: number;
  leverage: number;
  returnPct: number;
  finalAmount: number;
  profit: number;
  createdAt: string;
}

export interface AiAlert {
  id: string;
  simulationId: string;
  status: 'PENDING' | 'DONE' | 'FAILED';
  title: string | null;
  content: string | null;
  model: string | null;
  createdAt: string;
  completedAt: string | null;
  disclaimer: string;
}

export interface Scenario {
  finalAmount: number;
  profit: number;
  returnPct: number;
}

export interface ProjectionResponse {
  projection: {
    result: {
      horizonDays: number;
      simulations: number;
      sampleSize: number;
      leverage: number;
      pessimistic: Scenario;
      base: Scenario;
      optimistic: Scenario;
      expectedFinalAmount: number;
      probabilityOfLossPct: number;
    };
    currency: string;
    symbol: string;
    historyFrom: string;
    historyTo: string;
  };
  disclaimer: string;
}

export interface NewsArticle {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  source: string | null;
  publishedAt: string;
  sentimentScore: number | null;
  sentimentLabel: string | null;
}

export interface DailySentiment {
  date: string;
  sentiment: {
    count: number;
    meanScore: number;
    label: string;
    bullishCount: number;
    neutralCount: number;
    bearishCount: number;
  } | null;
}

export type NotificationType =
  'AI_ALERT_READY' | 'MARKET_VARIATION' | 'SECURITY_EVENT' | 'LICENSE_EXPIRING';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  variationThresholdPct: number;
  emailAvailable: boolean;
}

/** Cuerpo RFC 7807 que devuelve la API ante cualquier error. */
export interface Problem {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  traceId?: string;
  errors?: Record<string, string>;
  [key: string]: unknown;
}
