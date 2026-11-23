import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

/** Marco compartido por ingreso y cambio de contraseña: formulario a la izquierda, x2 a la derecha. */
export function AuthLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Volver al inicio">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="display text-4xl font-bold">{title}</h1>
          <div className="mt-3 text-ash">{intro}</div>
          <div className="mt-9">{children}</div>
        </main>
      </div>

      <aside
        aria-hidden
        className="relative hidden overflow-hidden border-l border-line bg-surface lg:flex lg:items-center lg:justify-center"
      >
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(60% 50% at 60% 55%, var(--glow), transparent)' }}
        />
        <div className="relative w-[26rem]">
          <p className="num font-display text-[7.5rem] leading-none font-extrabold text-ember">
            x2
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-card border border-line bg-bg/60 p-5 backdrop-blur">
              <p className="text-sm text-ash">NASDAQ 100</p>
              <p className="num mt-1 font-display text-3xl font-bold text-frost">+2,0 %</p>
            </div>
            <div className="rounded-card border border-line bg-bg/60 p-5 backdrop-blur">
              <p className="text-sm text-ash">Tu inversión</p>
              <p className="num mt-1 font-display text-3xl font-bold text-ember">+4,0 %</p>
            </div>
          </div>
          <p className="mt-6 max-w-[34ch] text-ash">
            El apalancamiento duplica las ganancias y también las pérdidas.
          </p>
        </div>
      </aside>
    </div>
  );
}
