import Lenis from 'lenis';
import { useEffect } from 'react';

let lenis: Lenis | null = null;

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Activa el scroll suave mientras el componente que lo usa esté montado (la landing). */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: false });
    let frame = requestAnimationFrame(function raf(time) {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    });
    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}

/** Desplaza a un ancla compensando la barra de navegación fija. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = -88;
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.2 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
  history.replaceState(null, '', `#${id}`);
}
