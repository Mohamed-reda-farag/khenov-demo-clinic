import { AppointmentFormDialog } from './AppointmentFormDialog';
import { AppointmentPanel } from './AppointmentPanel';

/** Mounted once in the shell so any screen can open them through the UI store. */
export function AppointmentDialogs() {
  return (
    <>
      <AppointmentPanel />
      <AppointmentFormDialog />
    </>
  );
}
