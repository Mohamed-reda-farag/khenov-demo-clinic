import type { Appointment, AppointmentStatus } from '@/data/types';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from './constants';
import { atTime, endOf } from './time';

const ACTIVE: AppointmentStatus[] = ['pending', 'confirmed', 'arrived'];

/** Still ahead of us and not finished or cancelled. These block deleting what they depend on. */
export function isUpcoming(appointment: Pick<Appointment, 'start' | 'status'>, now: Date): boolean {
  return (
    ACTIVE.includes(appointment.status) && new Date(appointment.start).getTime() >= now.getTime()
  );
}

const toMinutes = (hm: string) => {
  const [h = 0, m = 0] = hm.split(':').map(Number);
  return h * 60 + m;
};

/** `HH:mm` inside the calendar grid, at least one hour long. */
export function isValidWorkingHours(start: string, end: string): boolean {
  const valid = /^\d{2}:\d{2}$/;
  if (!valid.test(start) || !valid.test(end)) return false;
  return (
    toMinutes(start) >= CALENDAR_START_HOUR * 60 &&
    toMinutes(end) <= CALENDAR_END_HOUR * 60 &&
    toMinutes(end) - toMinutes(start) >= 60
  );
}

/** Upcoming appointments of the doctor that would fall outside the new working hours. */
export function hoursViolations(
  appointments: readonly Appointment[],
  doctorId: string,
  workStart: string,
  workEnd: string,
  now: Date,
): Appointment[] {
  return appointments.filter((a) => {
    if (a.doctorId !== doctorId || !isUpcoming(a, now)) return false;
    const start = new Date(a.start);
    return start < atTime(start, workStart) || endOf(start, a.durationMin) > atTime(start, workEnd);
  });
}
