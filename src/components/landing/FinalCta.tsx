import { ButtonLink } from '../ui/Button';
import { Logo } from '../ui/Logo';

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
      <div className="relative overflow-hidden rounded-shell border border-line bg-surface px-6 py-16 shadow-soft sm:px-14 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -bottom-40 size-[34rem] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }}
        />
        <h2 className="display relative max-w-xl text-3xl font-bold sm:text-4xl">
          Tu próxima decisión empieza con una simulación.
        </h2>
        <p className="relative mt-5 max-w-[48ch] text-lg text-ash">
          Ingresa con la cuenta que te dio tu empresa.
        </p>
        <ButtonLink to="/login" className="relative mt-9">
          Ingresar
        </ButtonLink>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-ash sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo className="text-ink" />
        <p className="max-w-[60ch]">
          Herramienta de apoyo a decisiones. Las simulaciones no son una recomendación de inversión;
          el apalancamiento amplifica las pérdidas.
        </p>
        <p className="num">© {new Date().getFullYear()} RiTech</p>
      </div>
    </footer>
  );
}
