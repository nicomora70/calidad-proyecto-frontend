import { Bell, ChevronDown, KeyRound, LogOut, Menu, X } from 'lucide-react';
import { useUnreadCount } from '../../lib/queries';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_LABEL, useAuth } from '../../lib/auth';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NAV } from './nav';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const { hasRole } = useAuth();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {NAV.filter((item) => hasRole(...item.roles)).map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-ctrl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-ember/12 text-ember' : 'text-ash hover:bg-surface-2 hover:text-ink'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-ctrl py-1 pr-2 pl-1 hover:bg-surface-2"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ember text-xs font-bold text-on-ember">
          {initials(user.fullName)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-medium">{user.fullName}</span>
          <span className="block text-xs text-ash">{ROLE_LABEL[user.role]}</span>
        </span>
        <ChevronDown size={16} className="text-ash" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-card border border-line bg-surface p-1.5 shadow-soft"
        >
          <p className="truncate px-3 py-2 text-xs text-ash">{user.email}</p>
          <button
            role="menuitem"
            type="button"
            onClick={() => navigate('/cambiar-contrasena')}
            className="flex w-full items-center gap-2.5 rounded-ctrl px-3 py-2 text-sm hover:bg-surface-2"
          >
            <KeyRound size={16} /> Cambiar contraseña
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-ctrl px-3 py-2 text-sm hover:bg-surface-2"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationBell() {
  const { data: count = 0 } = useUnreadCount();
  const label = count === 0 ? 'Notificaciones' : `Notificaciones, ${count} sin leer`;
  return (
    <Link
      to="/app/notificaciones"
      aria-label={label}
      className="relative grid size-10 place-items-center rounded-ctrl border border-line text-ash transition-colors hover:text-ink"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="num absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[11px] font-bold text-on-ember">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export function AppShell() {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  // Menú móvil: foco dentro al abrir, Escape para cerrar, fondo sin scroll y foco de vuelta al cerrar.
  useEffect(() => {
    if (!drawer) return;
    const trigger = openButton.current;
    closeButton.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [drawer]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface px-4 py-5 lg:flex">
        <Link to="/app" className="px-2">
          <Logo />
        </Link>
        <div className="mt-8">
          <SideNav />
        </div>
      </aside>

      {drawer && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            tabIndex={-1}
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawer(false)}
          />
          <div className="relative h-full w-72 border-r border-line bg-surface px-4 py-5">
            <div className="flex items-center justify-between px-2">
              <Logo />
              <button
                ref={closeButton}
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setDrawer(false)}
                className="grid size-10 place-items-center rounded-ctrl"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-8">
              <SideNav onNavigate={() => setDrawer(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-8">
          <button
            ref={openButton}
            type="button"
            aria-label="Abrir menú"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className="grid size-10 place-items-center rounded-ctrl border border-line lg:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl font-bold">{title}</h1>
        {description && <p className="mt-2 max-w-[60ch] text-ash">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
