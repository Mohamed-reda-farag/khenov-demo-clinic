import type { Appointment, Doctor } from '@/data/types';
import { findConflicts } from './conflicts';
import { SLOT_STEP_MIN } from './constants';
import { atTime, endOf } from './time';

export interface SlotQuery {
  date: Date;
  doctor: Doctor;
  durationMin: number;
  appointments: readonly Appointment[];
  patientId: string | null;
  ignoreId?: string;
  stepMin?: number;
  /** When given, start times that are already in the past are not free. */
  now?: Date;
}

export interface Slot {
  start: Date;
  free: boolean;
}

/** Every start time inside the doctor's working hours where the service still ends in time. */
export function generateSlots(query: SlotQuery): Slot[] {
  const {
    date,
    doctor,
    durationMin,
    appointments,
    patientId,
    ignoreId,
    stepMin = SLOT_STEP_MIN,
    now,
  } = query;
  const workStart = atTime(date, doctor.workStart);
  const workEnd = atTime(date, doctor.workEnd);
  const slots: Slot[] = [];

  for (
    let start = workStart;
    endOf(start, durationMin).getTime() <= workEnd.getTime();
    start = endOf(start, stepMin)
  ) {
    const conflicts = findConflicts(
      { doctorId: doctor.id, patientId, start, durationMin, ignoreId },
      appointments,
      doctor,
      { now },
    );
    slots.push({ start, free: conflicts.length === 0 });
  }
  return slots;
}

/** The free start times (same day) closest to `target`, nearest first. */
export function suggestSlots(query: SlotQuery & { target: Date }, count = 3): Date[] {
  const { target } = query;
  return generateSlots({ ...query, date: target })
    .filter((slot) => slot.free)
    .sort(
      (a, b) =>
        Math.abs(a.start.getTime() - target.getTime()) -
          Math.abs(b.start.getTime() - target.getTime()) || a.start.getTime() - b.start.getTime(),
    )
    .slice(0, count)
    .map((slot) => slot.start);
}
