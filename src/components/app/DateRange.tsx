import { X } from 'lucide-react';
import type { DateFilter } from '../../lib/queries';
import { inputClass } from '../ui/Surface';

/** Filtro de fechas inclusivo (yyyy-mm-dd), en una fila sobre la tabla. */
export function DateRange({
  value,
  onChange,
}: {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}) {
  const active = value.from || value.to;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm">
        <span className="mb-1 block text-ash">Desde</span>
        <input
          type="date"
          className={inputClass}
          value={value.from ?? ''}
          max={value.to}
          onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-ash">Hasta</span>
        <input
          type="date"
          className={inputClass}
          value={value.to ?? ''}
          min={value.from}
          onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
        />
      </label>
      {active && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="flex h-10 items-center gap-1.5 rounded-ctrl px-3 text-sm text-ash hover:text-ink"
        >
          <X size={14} /> Quitar filtro
        </button>
      )}
    </div>
  );
}
