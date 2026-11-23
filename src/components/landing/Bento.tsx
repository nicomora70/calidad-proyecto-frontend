import { Bell, FileDown, Newspaper, Sparkles, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

const BARS = [1.2, -0.8, 0.6, 1.9, -1.4, 0.9, 1.5, -0.4, 2.1, 0.7];

function Tile({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <article
      className={`relative overflow-hidden rounded-card border border-line bg-surface p-6 shadow-soft sm:p-7 ${className}`}
    >
      {children}
    </article>
  );
}

function TileTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight">
      <span className="text-ember">{icon}</span>
      {children}
    </h3>
  );
}

export function Bento() {
  return (
    <section id="funciones" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="display text-4xl font-bold sm:text-5xl">
          Todo lo que necesitas para decidir, en un solo lugar.
        </h2>
        <p className="mt-5 text-lg text-ash">
          Cada empresa tiene su propia instalación de RiTech. Tus datos no salen de ella.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-12">
        <Tile className="md:col-span-8 md:row-span-2">
          <TileTitle icon={<TrendingUp size={20} />}>Simulaciones con datos del mercado</TileTitle>
          <p className="mt-3 max-w-[52ch] text-ash">
            Ingresa tu capital y RiTech calcula el resultado con la variación real del NASDAQ 100,
            multiplicada por dos. Cada simulación queda guardada en tu historial.
          </p>
          <div className="mt-10 flex h-48 items-center gap-2 sm:gap-3" aria-hidden>
            {BARS.map((v, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-center gap-1">
                <div className="flex h-1/2 items-end gap-1">
                  {v > 0 && (
                    <>
                      <span className="w-1/3 rounded-t-sm bg-frost/60" style={{ height: `${v * 20}%` }} />
                      <span className="w-2/3 rounded-t-sm bg-ember" style={{ height: `${v * 40}%` }} />
                    </>
                  )}
                </div>
                <div className="flex h-1/2 items-start gap-1">
                  {v < 0 && (
                    <>
                      <span className="w-1/3 rounded-b-sm bg-frost/60" style={{ height: `${-v * 20}%` }} />
                      <span className="w-2/3 rounded-b-sm bg-frost" style={{ height: `${-v * 40}%` }} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ash">
            Barra delgada: el índice. Barra gruesa: tu inversión x2.
          </p>
        </Tile>

        <Tile className="md:col-span-4">
          <TileTitle icon={<Sparkles size={20} />}>Alerta con IA</TileTitle>
          <p className="mt-3 text-ash">
            Después de cada simulación recibes una lectura del riesgo en lenguaje claro, basada en tus
            números y en el contexto del mercado.
          </p>
        </Tile>

        <Tile className="md:col-span-4">
          <TileTitle icon={<Newspaper size={20} />}>Noticias y sentimiento</TileTitle>
          <p className="mt-3 text-ash">
            Titulares del NASDAQ 100 con una medida de si el ánimo del mercado es positivo o negativo.
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-frost via-flare to-ember" />
          </div>
        </Tile>

        <Tile className="md:col-span-4">
          <TileTitle icon={<TrendingUp size={20} />}>Proyecciones</TileTitle>
          <p className="mt-3 text-ash">
            Mira hacia dónde podría ir tu capital en varios escenarios antes de mover un peso.
          </p>
        </Tile>

        <Tile className="md:col-span-4">
          <TileTitle icon={<Bell size={20} />}>Notificaciones</TileTitle>
          <p className="mt-3 text-ash">
            Te avisamos cuando tu alerta está lista, cuando el mercado se mueve fuerte o cuando hay un
            evento de seguridad en tu cuenta.
          </p>
        </Tile>

        <Tile className="md:col-span-4">
          <TileTitle icon={<FileDown size={20} />}>Exporta tu historial</TileTitle>
          <p className="mt-3 text-ash">
            Descarga tus simulaciones en CSV para tu contador o tu propia hoja de cálculo.
          </p>
        </Tile>
      </div>
    </section>
  );
}
