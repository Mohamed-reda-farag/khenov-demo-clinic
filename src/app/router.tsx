import type { ReactElement } from 'react';
import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { CalendarScreen } from '@/features/calendar/CalendarScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AppShell } from '@/features/shell/AppShell';
import { NAV_ITEMS, type NavId } from '@/features/shell/nav';
import { PlaceholderScreen } from '@/features/shell/PlaceholderScreen';
import { LoginGate, RequireRole, RequireSession, RoleHome } from './guards';

const SCREENS: Partial<Record<NavId, ReactElement>> = {
  dashboard: <DashboardScreen />,
  calendar: <CalendarScreen />,
  settings: <SettingsScreen />,
};

const screenRoutes: RouteObject[] = NAV_ITEMS.map((item) => ({
  path: item.path.slice(1),
  element: (
    <RequireRole roles={item.roles}>
      {SCREENS[item.id] ?? <PlaceholderScreen item={item} />}
    </RequireRole>
  ),
}));

// Hash routing works from file:// (Electron) and from any static host without server rewrites.
export const router = createHashRouter([
  {
    path: '/login',
    element: (
      <LoginGate>
        <LoginScreen />
      </LoginGate>
    ),
  },
  {
    path: '/',
    element: <RequireSession />,
    children: [
      {
        element: <AppShell />,
        children: [{ index: true, element: <RoleHome /> }, ...screenRoutes],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
