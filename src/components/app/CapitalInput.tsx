import { useId } from 'react';

const digitsOnly = (s: string) =>
  s
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 16);
const grouped = (digits: string) => (digits ? Number(digits).toLocaleString('es-CO') : '');

/** Campo de capital en pesos: acepta solo dígitos y muestra separadores de miles. */
export function CapitalInput({
  value,
  onChange,
  error,
  label = 'Capital a invertir',
}: {
  value: string;
  onChange: (digits: string) => void;
  error?: string;
  label?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-ash">
          $
        </span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1.000.000"
          value={grouped(value)}
          onChange={(e) => onChange(digitsOnly(e.target.value))}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="num placeholder:font-normal placeholder:text-ash/45 h-12 w-full rounded-ctrl border border-line bg-bg pr-14 pl-8 font-display text-xl font-semibold focus:border-ember focus:ring-3 focus:ring-ember/20 focus:outline-none focus-visible:outline-none aria-[invalid=true]:border-frost"
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ash">
          COP
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-frost">
          {error}
        </p>
      )}
    </div>
  );
}
