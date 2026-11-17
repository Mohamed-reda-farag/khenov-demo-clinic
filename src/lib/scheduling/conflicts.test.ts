import { describe, expect, it } from 'vitest';
import type { Appointment } from '@/data/types';
import { findConflicts } from './conflicts';

const doctor = { workStart: '09:00', workEnd: '21:00' };
const day = (h: number, m = 0) => new Date(2026, 10, 16, h, m);

function appointment(over: Partial<Appointment>): Appointment {
  return {
    id: 'ap-1',
    patientId: 'pt-1',
    doctorId: 'dr-1',
    serviceId: 'sv-1',
    start: day(10).toISOString(),
    durationMin: 30,
    status: 'confirmed',
    visitNote: null,
    cancelReason: null,
    ...over,
  };
}

const base = { doctorId: 'dr-1', patientId: 'pt-9', durationMin: 30 };

describe('findConflicts', () => {
  it('returns nothing for a free slot', () => {
    expect(findConflicts({ ...base, start: day(11) }, [appointment({})], doctor)).toEqual([]);
  });

  it('flags a doctor overlap and names the other appointment', () => {
    const result = findConflicts({ ...base, start: day(10, 15) }, [appointment({})], doctor);
    expect(result).toEqual([{ code: 'doctor_overlap', appointmentId: 'ap-1' }]);
  });

  it('treats back-to-back appointments as free', () => {
    expect(findConflicts({ ...base, start: day(10, 30) }, [appointment({})], doctor)).toEqual([]);
    expect(findConflicts({ ...base, start: day(9, 30) }, [appointment({})], doctor)).toEqual([]);
  });

  it('flags a patient overlap with another doctor', () => {
    const existing = appointment({ doctorId: 'dr-2', patientId: 'pt-9' });
    const result = findConflicts({ ...base, start: day(10) }, [existing], doctor);
    expect(result).toEqual([{ code: 'patient_overlap', appointmentId: 'ap-1' }]);
  });

  it('skips the patient check when no patient is chosen yet', () => {
    const existing = appointment({ doctorId: 'dr-2', patientId: 'pt-9' });
    expect(findConflicts({ ...base, patientId: null, start: day(10) }, [existing], doctor)).toEqual(
      [],
    );
  });

  it('flags times outside working hours', () => {
    const early = findConflicts({ ...base, start: day(8, 45) }, [], doctor);
    const late = findConflicts({ ...base, start: day(20, 45) }, [], doctor);
    expect(early).toEqual([{ code: 'outside_hours' }]);
    expect(late).toEqual([{ code: 'outside_hours' }]);
    expect(findConflicts({ ...base, start: day(20, 30) }, [], doctor)).toEqual([]);
  });

  it('ignores cancelled appointments and the appointment being edited', () => {
    const cancelled = appointment({ status: 'cancelled' });
    expect(findConflicts({ ...base, start: day(10) }, [cancelled], doctor)).toEqual([]);
    expect(
      findConflicts({ ...base, start: day(10), ignoreId: 'ap-1' }, [appointment({})], doctor),
    ).toEqual([]);
  });

  it('reports both conflicts when the same patient and doctor overlap', () => {
    const result = findConflicts(
      { ...base, patientId: 'pt-1', start: day(10) },
      [appointment({})],
      doctor,
    );
    expect(result.map((c) => c.code).sort()).toEqual(['doctor_overlap', 'patient_overlap']);
  });
});
