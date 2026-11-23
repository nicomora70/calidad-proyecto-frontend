import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="relative grid size-10 place-items-center rounded-ctrl border border-line text-ash transition-colors hover:text-ink"
    >
      <Sun
        size={18}
        className={`absolute transition-all duration-300 ${dark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 opacity-100'}`}
      />
      <Moon
        size={18}
        className={`absolute transition-all duration-300 ${dark ? 'scale-100 opacity-100' : 'scale-50 -rotate-90 opacity-0'}`}
      />
    </button>
  );
}
