import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { Role } from '@/data/types';
import { homePathFor } from '@/features/shell/nav';
import { useSessionStore } from '@/stores/sessionStore';

export function RequireSession() {
  const session = useSessionStore((state) => state.session);
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const session = useSessionStore((state) => state.session);
  if (!session) return <Navigate to="/login" replace />;
  return roles.includes(session.role) ? (
    children
  ) : (
    <Navigate to={homePathFor(session.role)} replace />
  );
}

export function RoleHome() {
  const session = useSessionStore((state) => state.session);
  return <Navigate to={session ? homePathFor(session.role) : '/login'} replace />;
}

export function LoginGate({ children }: { children: ReactNode }) {
  const session = useSessionStore((state) => state.session);
  return session ? <Navigate to="/" replace /> : children;
}
