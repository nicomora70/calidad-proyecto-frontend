import {
  Bell,
  LayoutDashboard,
  LineChart,
  Newspaper,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../types/api';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
}

const ALL: Role[] = ['ADMIN', 'IT_MANAGER', 'INVESTOR'];
const SIMULATE: Role[] = ['INVESTOR', 'ADMIN'];

export const NAV: NavItem[] = [
  { to: '/app', label: 'Inicio', icon: LayoutDashboard, roles: ALL, end: true },
  { to: '/app/simulaciones', label: 'Simulaciones', icon: TrendingUp, roles: SIMULATE },
  { to: '/app/proyecciones', label: 'Proyecciones', icon: LineChart, roles: SIMULATE },
  { to: '/app/noticias', label: 'Noticias', icon: Newspaper, roles: ALL },
  { to: '/app/notificaciones', label: 'Notificaciones', icon: Bell, roles: ALL },
];
