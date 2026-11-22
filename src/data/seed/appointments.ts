import { addDays, startOfDay } from 'date-fns';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { atMinutes } from '@/lib/scheduling/time';
import { doctors } from './doctors';
import { KIDS_COUNT, patients } from './patients';
import { services } from './services';

const DAY_OFFSETS = [-2, -1, 0, 1, 2, 3, 4];
const PER_DAY = [5, 6, 8, 6, 6, 5, 4]; // 40 appointments in total
const HISTORY_PER_DAY = [2, 3, 1, 2, 3, 2, 1];
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

/** Past appointments on the two days before today that the patient did not attend. */
const NO_SHOW_SLOTS = new Set(['-2:4', '-1:1']);

function statusFor(offset: number, index: number): AppointmentStatus {
  if (offset < 0) {
    if (NO_SHOW_SLOTS.has(`${offset}:${index}`)) return 'no_show';
    return index % 5 === 3 ? 'cancelled' : 'done';
  }
  if (offset === 0) return TODAY_STATUSES[index] ?? 'pending';
  if (offset === 1 && index === 4) return 'cancelled';
  return index % 3 === 0 ? 'confirmed' : 'pending';
}

/** Past history: mostly done, some cancelled, and a few patients who did not attend. */
function historyStatus(back: number, k: number): AppointmentStatus {
  if ((back + k) % 6 === 0) return 'cancelled';
  return (back * 2 + k) % 9 === 4 ? 'no_show' : 'done';
}

/**
 * Builds ~40 appointments around `today` plus ~55 past ones for the reports. Slots never overlap for the same doctor or patient.
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
      const slot = (k * 3 + dayIndex) % 22;
      items.push({
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: service.id,
        start: atMinutes(day, 9 * 60 + slot * 30).toISOString(),
        durationMin: service.durationMin,
        visitNote: null,
        cancelReason: null,
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

  // Past history (days -3 to -28) so the reports have something to show. Never overlaps.
  for (let back = 3; back <= 28; back += 1) {
    const day = startOfDay(addDays(today, -back));
    const count = HISTORY_PER_DAY[back % HISTORY_PER_DAY.length] ?? 1;
    for (let k = 0; k < count; k += 1) {
      const doctor = doctors[(k + back) % doctors.length]!;
      const options = services.filter((s) => s.specialtyKey === doctor.specialtyKey);
      const service = options[(k + back) % options.length]!;
      const pool = doctor.specialtyKey === 'pediatrics' ? kids : adults;
      const patient = pool[(k * 5 + back * 3 + 7) % pool.length]!;
      const slot = (k * 7 + back * 3) % 22;
      result.push({
        id: `ap-${String(sequence).padStart(3, '0')}`,
        patientId: patient.id,
        doctorId: doctor.id,
        serviceId: service.id,
        start: atMinutes(day, 9 * 60 + slot * 30).toISOString(),
        durationMin: service.durationMin,
        status: historyStatus(back, k),
        visitNote: null,
        cancelReason: null,
      });
      sequence += 1;
    }
  }

  return result;
}
