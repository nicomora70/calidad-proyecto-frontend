import {
  BarChart3,
  Bell,
  LayoutDashboard,
  LineChart,
  Newspaper,
  ScrollText,
  Settings,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../types/api';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
  /** Las herramientas de administración se agrupan aparte en la barra lateral. */
  admin?: boolean;
}

const ALL: Role[] = ['ADMIN', 'IT_MANAGER', 'INVESTOR'];
const SIMULATE: Role[] = ['INVESTOR', 'ADMIN'];
const STAFF: Role[] = ['ADMIN', 'IT_MANAGER'];

export const NAV: NavItem[] = [
  { to: '/app', label: 'Inicio', icon: LayoutDashboard, roles: ALL, end: true },
  { to: '/app/simulaciones', label: 'Simulaciones', icon: TrendingUp, roles: SIMULATE },
  { to: '/app/proyecciones', label: 'Proyecciones', icon: LineChart, roles: SIMULATE },
  { to: '/app/noticias', label: 'Noticias', icon: Newspaper, roles: ALL },
  { to: '/app/notificaciones', label: 'Notificaciones', icon: Bell, roles: ALL },
  { to: '/app/panel', label: 'Panel', icon: BarChart3, roles: ['ADMIN'], admin: true },
  { to: '/app/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'], admin: true },
  { to: '/app/auditoria', label: 'Auditoría', icon: ScrollText, roles: STAFF, admin: true },
  { to: '/app/configuracion', label: 'Configuración', icon: Settings, roles: STAFF, admin: true },
];
