import { describe, expect, it } from 'vitest';
import type { Appointment, Doctor } from '@/data/types';
import { generateSlots, suggestSlots } from './slots';

const date = new Date(2026, 10, 16);
const at = (h: number, m = 0) => new Date(2026, 10, 16, h, m);
const doctor: Doctor = {
  id: 'dr-1',
  name: { ar: 'د. تجربة', en: 'Dr. Test' },
  specialtyKey: 'internal',
  specialty: { ar: 'باطنة', en: 'Internal' },
  colorToken: 'doctor-1',
  workStart: '09:00',
  workEnd: '21:00',
};

function booked(h: number, m: number, durationMin: number): Appointment {
  return {
    id: `ap-${h}-${m}`,
    patientId: 'pt-1',
    doctorId: 'dr-1',
    serviceId: 'sv-1',
    start: at(h, m).toISOString(),
    durationMin,
    status: 'confirmed',
    visitNote: null,
    cancelReason: null,
  };
}

describe('generateSlots', () => {
  it('creates 15-minute starts that end inside working hours', () => {
    const slots = generateSlots({
      date,
      doctor,
      durationMin: 30,
      appointments: [],
      patientId: null,
    });
    expect(slots).toHaveLength(47);
    expect(slots[0]?.start).toEqual(at(9));
    expect(slots.at(-1)?.start).toEqual(at(20, 30));
    expect(slots.every((slot) => slot.free)).toBe(true);
  });

  it('marks slots that overlap an existing appointment as taken', () => {
    const slots = generateSlots({
      date,
      doctor,
      durationMin: 30,
      appointments: [booked(10, 0, 30)],
      patientId: null,
    });
    const taken = slots.filter((slot) => !slot.free).map((slot) => slot.start.getTime());
    expect(taken).toEqual([at(9, 45), at(10, 0), at(10, 15)].map((d) => d.getTime()));
  });

  it('accounts for the service duration', () => {
    const slots = generateSlots({
      date,
      doctor,
      durationMin: 45,
      appointments: [],
      patientId: null,
    });
    expect(slots.at(-1)?.start).toEqual(at(20, 15));
  });
});

describe('suggestSlots', () => {
  it('returns the nearest free starts first', () => {
    const suggestions = suggestSlots({
      date,
      target: at(10, 0),
      doctor,
      durationMin: 30,
      appointments: [booked(10, 0, 30)],
      patientId: null,
    });
    expect(suggestions).toEqual([at(9, 30), at(10, 30), at(9, 15)]);
  });
});
