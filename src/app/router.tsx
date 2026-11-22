import { lazy, Suspense, type ComponentType, type ReactElement } from 'react';
import { createHashRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AppShell } from '@/features/shell/AppShell';
import { NAV_ITEMS, type NavId } from '@/features/shell/nav';
import { LoginGate, RequireRole, RequireSession, RoleHome } from './guards';

// Every screen except the landing ones is its own chunk, loaded when it is first opened.
const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => load().then((module) => ({ default: module[key] })));

const CalendarScreen = named(() => import('@/features/calendar/CalendarScreen'), 'CalendarScreen');
const PatientsScreen = named(() => import('@/features/patients/PatientsScreen'), 'PatientsScreen');
const PatientProfileScreen = named(
  () => import('@/features/patients/PatientProfileScreen'),
  'PatientProfileScreen',
);
const DoctorsScreen = named(() => import('@/features/doctors/DoctorsScreen'), 'DoctorsScreen');
const DoctorDetailScreen = named(
  () => import('@/features/doctors/DoctorDetailScreen'),
  'DoctorDetailScreen',
);
const ServicesScreen = named(() => import('@/features/services/ServicesScreen'), 'ServicesScreen');
const ReportsScreen = named(() => import('@/features/reports/ReportsScreen'), 'ReportsScreen');
const MyReportsScreen = named(
  () => import('@/features/reports/MyReportsScreen'),
  'MyReportsScreen',
);
const MyDayScreen = named(() => import('@/features/doctor-role/MyDayScreen'), 'MyDayScreen');
const MyScheduleScreen = named(
  () => import('@/features/doctor-role/MyScheduleScreen'),
  'MyScheduleScreen',
);

function RouteFallback() {
  return (
    <div className="flex flex-col gap-4 p-6" aria-busy>
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96" />
    </div>
  );
}

const lazyScreen = (screen: ReactElement) => (
  <Suspense fallback={<RouteFallback />}>{screen}</Suspense>
);

const SCREENS: Record<NavId, ReactElement> = {
  dashboard: <DashboardScreen />,
  calendar: lazyScreen(<CalendarScreen />),
  patients: lazyScreen(<PatientsScreen />),
  doctors: lazyScreen(<DoctorsScreen />),
  services: lazyScreen(<ServicesScreen />),
  reports: lazyScreen(<ReportsScreen />),
  myDay: lazyScreen(<MyDayScreen />),
  mySchedule: lazyScreen(<MyScheduleScreen />),
  myReports: lazyScreen(<MyReportsScreen />),
  settings: <SettingsScreen />,
};

const screenRoutes: RouteObject[] = NAV_ITEMS.map((item) => ({
  path: item.path.slice(1),
  element: <RequireRole roles={item.roles}>{SCREENS[item.id]}</RequireRole>,
}));

const detailRoutes: RouteObject[] = [
  {
    path: 'patients/:id',
    element: (
      <RequireRole roles={['receptionist']}>{lazyScreen(<PatientProfileScreen />)}</RequireRole>
    ),
  },
  {
    path: 'doctors/:id',
    element: (
      <RequireRole roles={['receptionist']}>{lazyScreen(<DoctorDetailScreen />)}</RequireRole>
    ),
  },
];

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
        children: [{ index: true, element: <RoleHome /> }, ...screenRoutes, ...detailRoutes],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
