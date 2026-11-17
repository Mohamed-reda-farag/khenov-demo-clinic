import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { AppointmentDialogs } from '@/features/appointments/AppointmentDialogs';
import { useReloadData } from '@/features/appointments/useDataStatus';
import { useToastStore } from '@/stores/toastStore';
import { usePaletteStore } from '@/stores/paletteStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { SIDEBAR_COLLAPSED } from '@/theme/layout';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const { t } = useTranslation();
  const session = useSessionStore((state) => state.session);
  const collapsed = usePrefsStore((state) => state.sidebarCollapsed);
  const width = usePrefsStore((state) => state.sidebarWidth);
  const togglePalette = usePaletteStore((state) => state.toggle);
  const mainRef = useRef<HTMLElement>(null);
  const reloadData = useReloadData();

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // event.code keeps Ctrl/Cmd+K working on the Arabic keyboard layout too.
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyK') {
        event.preventDefault();
        togglePalette();
        return;
      }
      // Ctrl/Cmd+Z undoes the last change (the toast's Undo), unless the user is typing.
      const target = event.target as HTMLElement;
      const typing = target.closest('input, textarea, select, [contenteditable="true"]') !== null;
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && !event.shiftKey && !typing) {
        if (useToastStore.getState().runLastAction()) event.preventDefault();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [togglePalette]);

  if (!session) return null;

  return (
    <div
      className="grid h-dvh"
      style={{ gridTemplateColumns: `${collapsed ? SIDEBAR_COLLAPSED : width}px minmax(0, 1fr)` }}
    >
      <button
        type="button"
        onClick={() => mainRef.current?.focus()}
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        {t('shell.skipToContent')}
      </button>
      <Sidebar session={session} />
      <div className="flex min-h-0 min-w-0 flex-col">
        <Topbar />
        <main
          ref={mainRef}
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-y-auto focus:outline-none"
        >
          <Outlet />
        </main>
      </div>
      <CommandPalette role={session.role} />
      <AppointmentDialogs />
      <ToastViewport />
    </div>
  );
}
