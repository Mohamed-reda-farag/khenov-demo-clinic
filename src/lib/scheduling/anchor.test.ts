import { describe, expect, it } from 'vitest';
import type { Appointment } from '@/data/types';
import { daysSinceAnchor, formatAnchor, shiftAppointments } from './anchor';

const item: Appointment = {
  id: 'ap-1',
  patientId: 'pt-1',
  doctorId: 'dr-1',
  serviceId: 'sv-1',
  start: new Date(2026, 10, 16, 10, 30).toISOString(),
  durationMin: 30,
  status: 'pending',
  visitNote: null,
  cancelReason: null,
};

describe('seed anchor', () => {
  it('measures whole days between the seed day and today', () => {
    expect(daysSinceAnchor(formatAnchor(new Date(2026, 10, 16)), new Date(2026, 10, 16, 23))).toBe(
      0,
    );
    expect(daysSinceAnchor('2026-11-16', new Date(2026, 10, 19))).toBe(3);
  });

  it('shifts appointments by whole days and keeps the wall-clock time', () => {
    const [moved] = shiftAppointments([item], 3);
    const start = new Date(moved!.start);
    expect([start.getDate(), start.getHours(), start.getMinutes()]).toEqual([19, 10, 30]);
  });

  it('leaves appointments untouched when the day is the same', () => {
    expect(shiftAppointments([item], 0)).toEqual([item]);
  });
});
