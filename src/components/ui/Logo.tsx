export function Logo({
  className = '',
  name = 'RiTech',
  logoUrl,
}: {
  className?: string;
  /** Nombre del producto según el branding de la instalación. */
  name?: string;
  /** Logo propio de la empresa (https); si falta, se usa la marca de RiTech. */
  logoUrl?: string | null;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt="" className="size-8 rounded-[9px] object-contain" />
      ) : (
        <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
          <rect width="32" height="32" rx="9" fill="var(--ember)" />
          <path
            d="M7 21l6-6 4 4 8-9"
            fill="none"
            stroke="var(--on-ember)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="max-w-40 truncate font-display text-lg font-bold tracking-tight">
        {name}
      </span>
    </span>
  );
}
