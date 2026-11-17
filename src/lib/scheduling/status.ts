import type { AppointmentStatus } from '@/data/types';

/** The happy path shown as a stepper (Cancelled branches off it). */
export const STATUS_FLOW: AppointmentStatus[] = ['pending', 'confirmed', 'arrived', 'done'];

const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['arrived', 'cancelled'],
  arrived: ['done', 'cancelled'],
  done: [],
  cancelled: [],
};

export function nextStatuses(status: AppointmentStatus): AppointmentStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The forward step (everything except cancelling), or null when the flow is finished. */
export function forwardStatus(status: AppointmentStatus): AppointmentStatus | null {
  return TRANSITIONS[status].find((next) => next !== 'cancelled') ?? null;
}
