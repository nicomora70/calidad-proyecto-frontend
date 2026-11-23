import { scrollToId } from '../../lib/smooth-scroll';
import { Button, ButtonLink } from '../ui/Button';
import { X2Lens } from './X2Lens';

export function Hero() {
  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-32 pb-20 sm:px-6 lg:grid-cols-12 lg:gap-10 lg:pt-40 lg:pb-28">
      <div className="lg:col-span-5">
        <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-ash">
          <span className="size-1.5 rounded-full bg-ember" />
          NASDAQ 100 con apalancamiento x2
        </p>
        <h1 className="display mt-6 text-4xl font-bold sm:text-5xl">
          Cuando el índice se mueve, tu inversión se mueve el doble.
        </h1>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ash">
          RiTech simula, proyecta y vigila tu inversión apalancada para que decidas con números, no
          con intuición. Si el NASDAQ 100 sube 2&nbsp;%, ganas 4&nbsp;%. Si baja 2&nbsp;%, pierdes 4&nbsp;%.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <ButtonLink to="/login">Simula tu inversión</ButtonLink>
          <Button variant="ghost" onClick={() => scrollToId('funciones')}>
            Ver funciones
          </Button>
        </div>
      </div>
      <div className="lg:col-span-7">
        <X2Lens />
      </div>
    </section>
  );
}
