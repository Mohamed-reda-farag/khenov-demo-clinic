import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Settings,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/data/types';

export type NavId =
  | 'dashboard'
  | 'calendar'
  | 'patients'
  | 'doctors'
  | 'services'
  | 'reports'
  | 'myDay'
  | 'mySchedule'
  | 'settings';

export interface NavItem {
  id: NavId;
  path: string;
  icon: LucideIcon;
  labelKey: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    labelKey: 'nav.dashboard',
    roles: ['receptionist'],
  },
  {
    id: 'calendar',
    path: '/calendar',
    icon: CalendarDays,
    labelKey: 'nav.calendar',
    roles: ['receptionist'],
  },
  {
    id: 'patients',
    path: '/patients',
    icon: Users,
    labelKey: 'nav.patients',
    roles: ['receptionist'],
  },
  {
    id: 'doctors',
    path: '/doctors',
    icon: Stethoscope,
    labelKey: 'nav.doctors',
    roles: ['receptionist'],
  },
  {
    id: 'services',
    path: '/services',
    icon: ClipboardList,
    labelKey: 'nav.services',
    roles: ['receptionist'],
  },
  {
    id: 'reports',
    path: '/reports',
    icon: BarChart3,
    labelKey: 'nav.reports',
    roles: ['receptionist'],
  },
  { id: 'myDay', path: '/my-day', icon: ListChecks, labelKey: 'nav.myDay', roles: ['doctor'] },
  {
    id: 'mySchedule',
    path: '/my-schedule',
    icon: CalendarRange,
    labelKey: 'nav.mySchedule',
    roles: ['doctor'],
  },
  {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    labelKey: 'nav.settings',
    roles: ['receptionist', 'doctor'],
  },
];

export function navFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function homePathFor(role: Role): string {
  return role === 'doctor' ? '/my-day' : '/dashboard';
}
