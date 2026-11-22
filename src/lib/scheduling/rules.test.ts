import { describe, expect, it } from 'vitest';
import type { Appointment } from '@/data/types';
import { hoursViolations, isUpcoming, isValidWorkingHours } from './rules';

const now = new Date(2026, 10, 17, 12, 0);

function appointment(over: Partial<Appointment>): Appointment {
  return {
    id: 'ap-1',
    patientId: 'pt-1',
    doctorId: 'dr-1',
    serviceId: 'sv-1',
    start: new Date(2026, 10, 18, 10, 0).toISOString(),
    durationMin: 30,
    status: 'confirmed',
    visitNote: null,
    cancelReason: null,
    ...over,
  };
}

describe('isUpcoming', () => {
  it('counts active appointments that are still ahead', () => {
    expect(isUpcoming(appointment({}), now)).toBe(true);
    expect(isUpcoming(appointment({ status: 'pending' }), now)).toBe(true);
    expect(isUpcoming(appointment({ status: 'arrived' }), now)).toBe(true);
  });

  it('ignores finished, cancelled and past appointments', () => {
    expect(isUpcoming(appointment({ status: 'done' }), now)).toBe(false);
    expect(isUpcoming(appointment({ status: 'cancelled' }), now)).toBe(false);
    expect(
      isUpcoming(appointment({ start: new Date(2026, 10, 16, 10, 0).toISOString() }), now),
    ).toBe(false);
  });
});

describe('working hours', () => {
  it('accepts hours inside the grid that are at least one hour long', () => {
    expect(isValidWorkingHours('09:00', '21:00')).toBe(true);
    expect(isValidWorkingHours('10:30', '15:30')).toBe(true);
  });

  it('rejects hours outside the grid, too short or malformed', () => {
    expect(isValidWorkingHours('08:00', '17:00')).toBe(false);
    expect(isValidWorkingHours('09:00', '22:00')).toBe(false);
    expect(isValidWorkingHours('12:00', '12:30')).toBe(false);
    expect(isValidWorkingHours('14:00', '12:00')).toBe(false);
    expect(isValidWorkingHours('9:00', '17:00')).toBe(false);
  });

  it('finds upcoming appointments that the new hours would leave outside', () => {
    const inside = appointment({ id: 'a', start: new Date(2026, 10, 18, 10, 0).toISOString() });
    const late = appointment({ id: 'b', start: new Date(2026, 10, 18, 16, 45).toISOString() });
    const otherDoctor = appointment({ id: 'c', doctorId: 'dr-2', start: late.start });
    const result = hoursViolations([inside, late, otherDoctor], 'dr-1', '09:00', '17:00', now);
    expect(result.map((a) => a.id)).toEqual(['b']);
  });
});

describe('doctorLoad', () => {
  it("counts the doctor's active appointments of the day against their working hours", async () => {
    const { doctorLoad } = await import('./load');
    const doctor = { id: 'dr-1', workStart: '09:00', workEnd: '17:00' } as Parameters<
      typeof doctorLoad
    >[1];
    const tomorrow = new Date(2026, 10, 18);
    const load = doctorLoad(
      [
        appointment({ id: 'a' }),
        appointment({ id: 'b', status: 'cancelled' }),
        appointment({ id: 'c', doctorId: 'dr-2' }),
      ],
      doctor,
      tomorrow,
    );
    expect(load).toEqual({ count: 1, bookedMin: 30, workMin: 480 });
  });
});
