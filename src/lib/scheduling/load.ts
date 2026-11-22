import type { Appointment, Doctor } from '@/data/types';
import { atTime } from './time';

export interface DoctorLoad {
  /** Appointments that day, cancelled ones excluded. */
  count: number;
  bookedMin: number;
  /** Length of the doctor's working day in minutes. */
  workMin: number;
}

export function doctorLoad(
  appointments: readonly Appointment[],
  doctor: Doctor,
  day: Date,
): DoctorLoad {
  const mine = appointments.filter(
    (a) =>
      a.doctorId === doctor.id &&
      a.status !== 'cancelled' &&
      new Date(a.start).toDateString() === day.toDateString(),
  );
  const workMin =
    (atTime(day, doctor.workEnd).getTime() - atTime(day, doctor.workStart).getTime()) / 60_000;
  return {
    count: mine.length,
    bookedMin: mine.reduce((sum, a) => sum + a.durationMin, 0),
    workMin,
  };
}
