import { LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { Role } from '../../types/api';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  end?: boolean;
}

const ALL: Role[] = ['ADMIN', 'IT_MANAGER', 'INVESTOR'];

export const NAV: NavItem[] = [{ to: '/app', label: 'Inicio', icon: LayoutDashboard, roles: ALL, end: true }];
