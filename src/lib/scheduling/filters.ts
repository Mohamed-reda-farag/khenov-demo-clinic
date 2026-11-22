import type { Appointment, Doctor, SpecialtyKey } from '@/data/types';

export type SpecialtyFilter = 'all' | SpecialtyKey;

/** Doctors that belong to the chosen specialty (`'all'` keeps everyone). */
export function doctorsForSpecialty<T extends Pick<Doctor, 'specialtyKey'>>(
  doctors: readonly T[],
  specialty: SpecialtyFilter,
): T[] {
  return specialty === 'all' ? [...doctors] : doctors.filter((d) => d.specialtyKey === specialty);
}

/** Keeps the chosen doctor only while they still belong to the specialty; otherwise back to `'all'`. */
export function resolveDoctorFilter(
  doctors: readonly Pick<Doctor, 'id' | 'specialtyKey'>[],
  specialty: SpecialtyFilter,
  doctorFilter: string,
): string {
  if (doctorFilter === 'all') return 'all';
  const doctor = doctors.find((d) => d.id === doctorFilter);
  if (!doctor) return 'all';
  return specialty === 'all' || doctor.specialtyKey === specialty ? doctorFilter : 'all';
}

/**
 * The doctors the calendar shows for a specialty + doctor selection:
 * the chosen doctor, or every doctor of the specialty, or everyone.
 */
export function visibleDoctors<T extends Pick<Doctor, 'id' | 'specialtyKey'>>(
  doctors: readonly T[],
  specialty: SpecialtyFilter,
  doctorFilter: string,
): T[] {
  const inSpecialty = doctorsForSpecialty(doctors, specialty);
  const resolved = resolveDoctorFilter(doctors, specialty, doctorFilter);
  return resolved === 'all' ? inSpecialty : inSpecialty.filter((d) => d.id === resolved);
}

/** Appointments of the visible doctors only. */
export function filterAppointments<T extends Pick<Appointment, 'doctorId'>>(
  appointments: readonly T[],
  doctorIds: readonly string[],
): T[] {
  const ids = new Set(doctorIds);
  return appointments.filter((a) => ids.has(a.doctorId));
}
