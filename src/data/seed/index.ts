import { formatAnchor } from '@/lib/scheduling/anchor';
import { buildAppointments } from './appointments';
import { doctors } from './doctors';
import { buildNotifications } from './notifications';
import { patients } from './patients';
import { services } from './services';

/** `empty` starts a clean clinic (no patients, appointments or notifications) for the `?demo=empty` switch. */
export function buildSeed(now: Date, empty = false): Record<string, unknown> {
  const appointments = empty ? [] : buildAppointments(now);
  return {
    doctors,
    patients: empty ? [] : patients,
    services,
    appointments,
    notifications: empty ? [] : buildNotifications(now, appointments),
    // The day the appointments were generated for; see reanchorAppointments().
    anchor: formatAnchor(now),
  };
}
