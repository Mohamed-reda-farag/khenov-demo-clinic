import type { Appointment, NotificationDraft } from '@/data/types';

const empty = { patientId: null, appointmentId: null, status: null, when: null, count: null };

/**
 * The notification a change should produce, or null when it is not worth one
 * (for example a visit note). `before` is null for a new booking, `after` is null for a deletion.
 */
export function notificationForChange(
  before: Appointment | null,
  after: Appointment | null,
): NotificationDraft | null {
  if (!before && after) {
    return {
      ...empty,
      type: 'booked',
      patientId: after.patientId,
      appointmentId: after.id,
      when: after.start,
    };
  }
  if (before && !after) {
    return { ...empty, type: 'deleted', patientId: before.patientId, when: before.start };
  }
  if (!before || !after) return null;

  if (before.status !== after.status) {
    return {
      ...empty,
      type: 'status',
      status: after.status,
      patientId: after.patientId,
      appointmentId: after.id,
      when: after.start,
    };
  }
  if (before.start !== after.start || before.doctorId !== after.doctorId) {
    return {
      ...empty,
      type: 'rescheduled',
      patientId: after.patientId,
      appointmentId: after.id,
      when: after.start,
    };
  }
  return null;
}
