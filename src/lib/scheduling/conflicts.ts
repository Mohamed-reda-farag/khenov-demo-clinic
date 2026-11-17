import type { Appointment, Doctor } from '@/data/types';
import { atTime, endOf, overlaps } from './time';

export type ConflictCode = 'doctor_overlap' | 'patient_overlap' | 'outside_hours';

export interface Conflict {
  code: ConflictCode;
  /** The existing appointment that overlaps (overlap conflicts only). */
  appointmentId?: string;
}

export interface ConflictCandidate {
  doctorId: string;
  /** `null` while no patient is chosen yet: the patient check is skipped. */
  patientId: string | null;
  start: Date;
  durationMin: number;
  /** Appointment being edited or moved: ignored when comparing. */
  ignoreId?: string;
}

/**
 * Pure booking rules, shared by the UI and the repositories:
 * doctor overlap, patient overlap and outside working hours. Cancelled appointments never block.
 */
export function findConflicts(
  candidate: ConflictCandidate,
  appointments: readonly Appointment[],
  doctor: Pick<Doctor, 'workStart' | 'workEnd'>,
): Conflict[] {
  const start = candidate.start;
  const end = endOf(start, candidate.durationMin);
  const conflicts: Conflict[] = [];

  if (start < atTime(start, doctor.workStart) || end > atTime(start, doctor.workEnd)) {
    conflicts.push({ code: 'outside_hours' });
  }

  for (const existing of appointments) {
    if (existing.id === candidate.ignoreId || existing.status === 'cancelled') continue;
    const existingStart = new Date(existing.start);
    const existingEnd = endOf(existingStart, existing.durationMin);
    if (!overlaps(start, end, existingStart, existingEnd)) continue;

    if (existing.doctorId === candidate.doctorId) {
      conflicts.push({ code: 'doctor_overlap', appointmentId: existing.id });
    }
    if (candidate.patientId !== null && existing.patientId === candidate.patientId) {
      conflicts.push({ code: 'patient_overlap', appointmentId: existing.id });
    }
  }

  return conflicts;
}
