import { AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '../../lib/errors';
import { Button } from './Button';

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={`rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-ctrl bg-surface-2 ${className}`} />;
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <Inbox size={28} className="text-ash" aria-hidden />
      <p className="mt-3 font-medium">{title}</p>
      {text && <p className="mt-1 max-w-[44ch] text-sm text-ash">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-4 py-12 text-center">
      <AlertTriangle size={28} className="text-frost" aria-hidden />
      <p className="mt-3 max-w-[48ch] font-medium">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="ghost" className="mt-5" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-end gap-2 text-sm">
      <span className="num mr-2 text-ash">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        aria-label="Página anterior"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        className="grid size-9 place-items-center rounded-ctrl border border-line disabled:opacity-40"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        aria-label="Página siguiente"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className="grid size-9 place-items-center rounded-ctrl border border-line disabled:opacity-40"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

/** Cifra con signo coloreada: cálido si gana, frío si pierde. */
export function Signed({ value, children }: { value: number; children: ReactNode }) {
  return <span className={`num ${value >= 0 ? 'text-ember' : 'text-frost'}`}>{children}</span>;
}

export const selectClass =
  'h-10 rounded-ctrl border border-line bg-bg px-3 text-sm text-ink focus:border-ember focus:outline-none';
export const inputClass =
  'h-10 rounded-ctrl border border-line bg-bg px-3 text-sm text-ink focus:border-ember focus:outline-none';
