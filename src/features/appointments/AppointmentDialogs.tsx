import { lazy } from 'react';
import { LazyMount } from '@/components/ui/LazyMount';
import { useUiStore } from '@/stores/uiStore';

const AppointmentPanel = lazy(() =>
  import('./AppointmentPanel').then((module) => ({ default: module.AppointmentPanel })),
);
const AppointmentFormDialog = lazy(() =>
  import('./AppointmentFormDialog').then((module) => ({ default: module.AppointmentFormDialog })),
);

/** Mounted once in the shell so any screen can open them through the UI store. Loaded on first use. */
export function AppointmentDialogs() {
  const detailOpen = useUiStore((state) => state.detailId !== null);
  const formOpen = useUiStore((state) => state.form !== null);
  return (
    <>
      <LazyMount when={detailOpen}>
        <AppointmentPanel />
      </LazyMount>
      <LazyMount when={formOpen}>
        <AppointmentFormDialog />
      </LazyMount>
    </>
  );
}
