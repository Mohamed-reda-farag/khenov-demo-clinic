import { formatAnchor } from '@/lib/scheduling/anchor';
import { buildAppointments } from './appointments';
import { doctors } from './doctors';
import { patients } from './patients';
import { services } from './services';

export function buildSeed(now: Date): Record<string, unknown> {
  return {
    doctors,
    patients,
    services,
    appointments: buildAppointments(now),
    // The day the appointments were generated for; see reanchorAppointments().
    anchor: formatAnchor(now),
  };
}
