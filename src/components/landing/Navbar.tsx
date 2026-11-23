import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { scrollToId } from '../../lib/smooth-scroll';
import { ButtonLink } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';

const LINKS = [
  { id: 'funciones', label: 'Funciones' },
  { id: 'acceso', label: 'Cómo empezar' },
  { id: 'preguntas', label: 'Preguntas' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'border-b border-line bg-bg/75 backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="RiTech, inicio" onClick={() => window.scrollTo({ top: 0 })}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.id);
                }}
                className="rounded-ctrl px-3.5 py-2 text-sm text-ash transition-colors hover:text-ink"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink to="/login" className="hidden sm:inline-flex">
            Ingresar
          </ButtonLink>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-ctrl border border-line md:hidden"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-bg px-4 pb-5 md:hidden">
          <ul className="flex flex-col py-2">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => go(l.id)}
                  className="w-full py-3 text-left text-base"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
          <ButtonLink to="/login" className="w-full">
            Ingresar
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
