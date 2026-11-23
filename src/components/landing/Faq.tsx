import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const ITEMS = [
  {
    q: '¿Qué significa apalancamiento x2?',
    a: 'Tu inversión replica el doble de la variación diaria del NASDAQ 100. Si el índice sube 2 %, tu inversión sube 4 %; si baja 2 %, baja 4 %. Las ganancias crecen más rápido, y las pérdidas también.',
  },
  {
    q: '¿De dónde salen los datos del mercado?',
    a: 'RiTech consulta la variación del NASDAQ 100 a un proveedor de datos de mercado y la guarda en caché para responder rápido.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Cada empresa tiene su propia instalación. El acceso usa sesiones con token que expiran, y cada acción importante queda en un registro de auditoría.',
  },
  {
    q: '¿Puedo crear mi propia cuenta?',
    a: 'No. Las cuentas las crea el administrador de tu empresa. Pídele tu acceso y una contraseña temporal.',
  },
  {
    q: '¿Una simulación mueve dinero real?',
    a: 'No. Las simulaciones y proyecciones son herramientas de análisis. No ejecutan operaciones.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="preguntas" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-4 py-24 sm:px-6 lg:grid-cols-12">
      <h2 className="display text-4xl font-bold sm:text-5xl lg:col-span-4">Preguntas frecuentes</h2>
      <ul className="lg:col-span-8">
        {ITEMS.map((item, i) => {
          const expanded = open === i;
          return (
            <li key={item.q} className="border-b border-line">
              <h3>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(expanded ? null : i)}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-medium"
                >
                  {item.q}
                  <Plus
                    size={20}
                    className={`shrink-0 transition-transform duration-300 ${expanded ? 'rotate-45 text-ember' : 'text-ash'}`}
                  />
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div
                    id={`faq-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[62ch] pb-6 leading-relaxed text-ash">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
