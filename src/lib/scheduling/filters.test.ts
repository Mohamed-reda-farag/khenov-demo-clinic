import { describe, expect, it } from 'vitest';
import {
  doctorsForSpecialty,
  filterAppointments,
  resolveDoctorFilter,
  visibleDoctors,
} from './filters';

const doctors = [
  { id: 'dr-1', specialtyKey: 'internal' as const },
  { id: 'dr-2', specialtyKey: 'pediatrics' as const },
  { id: 'dr-3', specialtyKey: 'dental' as const },
  { id: 'dr-4', specialtyKey: 'internal' as const },
];

describe('specialty + doctor filter', () => {
  it('narrows the doctor options to the specialty, and "all" clears it', () => {
    expect(doctorsForSpecialty(doctors, 'internal').map((d) => d.id)).toEqual(['dr-1', 'dr-4']);
    expect(doctorsForSpecialty(doctors, 'dental').map((d) => d.id)).toEqual(['dr-3']);
    expect(doctorsForSpecialty(doctors, 'all')).toHaveLength(4);
  });

  it('resets an incompatible doctor and keeps a compatible one', () => {
    expect(resolveDoctorFilter(doctors, 'pediatrics', 'dr-1')).toBe('all');
    expect(resolveDoctorFilter(doctors, 'internal', 'dr-4')).toBe('dr-4');
    expect(resolveDoctorFilter(doctors, 'all', 'dr-3')).toBe('dr-3');
    expect(resolveDoctorFilter(doctors, 'internal', 'all')).toBe('all');
    expect(resolveDoctorFilter(doctors, 'internal', 'dr-missing')).toBe('all');
  });

  it('shows only the doctors of the specialty (or the chosen one)', () => {
    expect(visibleDoctors(doctors, 'internal', 'all').map((d) => d.id)).toEqual(['dr-1', 'dr-4']);
    expect(visibleDoctors(doctors, 'internal', 'dr-4').map((d) => d.id)).toEqual(['dr-4']);
    // An incompatible leftover doctor never hides the whole specialty.
    expect(visibleDoctors(doctors, 'dental', 'dr-1').map((d) => d.id)).toEqual(['dr-3']);
    expect(visibleDoctors(doctors, 'all', 'all')).toHaveLength(4);
  });

  it('limits appointments to the visible doctors', () => {
    const appointments = [{ doctorId: 'dr-1' }, { doctorId: 'dr-2' }, { doctorId: 'dr-4' }];
    expect(filterAppointments(appointments, ['dr-1', 'dr-4'])).toHaveLength(2);
    expect(filterAppointments(appointments, [])).toHaveLength(0);
  });
});
