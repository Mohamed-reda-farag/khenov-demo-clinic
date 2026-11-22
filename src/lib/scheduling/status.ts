import type { Appointment, AppointmentStatus } from '@/data/types';
import { endOf } from './time';

/** The happy path shown as a stepper (Cancelled and No-show branch off it). */
export const STATUS_FLOW: AppointmentStatus[] = ['pending', 'confirmed', 'arrived', 'done'];

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['arrived', 'cancelled', 'no_show'],
  arrived: ['done', 'cancelled'],
  done: [],
  cancelled: [],
  no_show: [],
};

/** Finished appointments: they can no longer be moved, rescheduled or edited. */
export const LOCKED_STATUSES: readonly AppointmentStatus[] = ['done', 'cancelled', 'no_show'];

export function isLockedStatus(status: AppointmentStatus): boolean {
  return LOCKED_STATUSES.includes(status);
}

/** Statuses that are not part of the forward flow. */
const SIDE_EXITS: readonly AppointmentStatus[] = ['cancelled', 'no_show'];

/** Static flow only; whether No-show is allowed right now also depends on the clock (see canTransitionAt). */
export function nextStatuses(status: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The forward step (everything except cancelling / no-show), or null when the flow is finished. */
export function forwardStatus(status: AppointmentStatus): AppointmentStatus | null {
  return TRANSITIONS[status].find((next) => !SIDE_EXITS.includes(next)) ?? null;
}

type TimedAppointment = Pick<Appointment, 'start' | 'durationMin' | 'status'>;

/** True once the appointment's end time has been reached (`now >= end`). */
export function hasEnded(
  appointment: Pick<Appointment, 'start' | 'durationMin'>,
  now: Date,
): boolean {
  return now.getTime() >= endOf(new Date(appointment.start), appointment.durationMin).getTime();
}

/** No-show: Pending or Confirmed, and only after the end time has passed. */
export function canMarkNoShow(appointment: TimedAppointment, now: Date): boolean {
  return canTransition(appointment.status, 'no_show') && hasEnded(appointment, now);
}

/** The flow rule plus the clock rule. This is what the repository enforces. */
export function canTransitionAt(
  appointment: TimedAppointment,
  to: AppointmentStatus,
  now: Date,
): boolean {
  if (!canTransition(appointment.status, to)) return false;
  return to === 'no_show' ? hasEnded(appointment, now) : true;
}
