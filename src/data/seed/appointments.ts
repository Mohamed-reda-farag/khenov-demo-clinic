import { addDays, addMinutes, startOfDay } from 'date-fns';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { doctors } from './doctors';
import { KIDS_COUNT, patients } from './patients';
import { services } from './services';

const DAY_OFFSETS = [-2, -1, 0, 1, 2, 3, 4];
const PER_DAY = [5, 6, 8, 6, 6, 5, 4]; // 40 appointments in total
const TODAY_STATUSES: AppointmentStatus[] = [
  'done',
  'done',
  'arrived',
  'confirmed',
  'confirmed',
  'pending',
  'confirmed',
  'pending',
];

const kids = patients.slice(0, KIDS_COUNT);
const adults = patients.slice(KIDS_COUNT);

function statusFor(offset: number, index: number): AppointmentStatus {
  if (offset < 0) return index % 5 === 3 ? 'cancelled' : 'done';
  if (offset === 0) return TODAY_STATUSES[index] ?? 'pending';
  if (offset === 1 && index === 4) return 'cancelled';
  return index % 3 === 0 ? 'confirmed' : 'pending';
}

/**
 * Builds ~40 appointments around `today`. Slots never overlap for the same doctor or patient.
 * Statuses follow chronological order (earlier slots are further along the flow).
 */
export function buildAppointments(today: Date): Appointment[] {
  const result: Appointment[] = [];
  let sequence = 1;

  DAY_OFFSETS.forEach((offset, dayIndex) => {
    const day = startOfDay(addDays(today, offset));
    const items: Array<Omit<Appointment, 'id' | 'status'>> = [];

    for (let k = 0; k < (PER_DAY[dayIndex] ?? 0); k += 1) {
      const doctor = doctors[(k + dayIndex) % doctors.length]!;
      const options = services.filter((s) => s.specialtyKey === doctor.specialtyKey);
      const service = options[(k + dayIndex) % options.length]!;
      const pool = doctor.specialtyKey === 'pediatrics' ? kids : adults;
      const patient = pool[(k * 5 + dayIndex * 3) % pool.length]!;
      const slot = (k * 3 + dayIndex) % 14;
      items.push({
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: service.id,
        start: addMinutes(day, 9 * 60 + slot * 30).toISOString(),
        durationMin: service.durationMin,
        visitNote: null,
      });
    }

    items
      .sort((a, b) => a.start.localeCompare(b.start))
      .forEach((item, index) => {
        result.push({
          ...item,
          id: `ap-${String(sequence).padStart(3, '0')}`,
          status: statusFor(offset, index),
        });
        sequence += 1;
      });
  });

  return result;
}
