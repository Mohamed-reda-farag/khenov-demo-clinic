import { describe, expect, it } from 'vitest';
import type { Appointment, Doctor } from '@/data/types';
import { setClock, now } from '@/lib/clock';
import { findConflicts } from './conflicts';
import { earliestBookable, isPastStart } from './past';
import { generateSlots, suggestSlots } from './slots';

const at = (h: number, m = 0, s = 0, ms = 0, day = 17) => new Date(2026, 10, day, h, m, s, ms);

describe('earliestBookable', () => {
  it('keeps a time that is exactly on a quarter hour', () => {
    expect(earliestBookable(at(10, 15))).toEqual(at(10, 15));
    expect(earliestBookable(at(10, 0))).toEqual(at(10, 0));
  });

  it('rounds up to the next quarter hour', () => {
    expect(earliestBookable(at(10, 16))).toEqual(at(10, 30));
    expect(earliestBookable(at(10, 1))).toEqual(at(10, 15));
    expect(earliestBookable(at(10, 44))).toEqual(at(10, 45));
    expect(earliestBookable(at(10, 46))).toEqual(at(11, 0));
  });

  it('rounds up even by a second or a millisecond past the quarter hour', () => {
    expect(earliestBookable(at(10, 15, 1))).toEqual(at(10, 30));
    expect(earliestBookable(at(10, 15, 0, 1))).toEqual(at(10, 30));
  });
});

describe('isPastStart', () => {
  const clock = at(10, 16);

  it('rejects the minute before and exactly the current time', () => {
    expect(isPastStart(at(10, 15), clock)).toBe(true);
    expect(isPastStart(at(10, 16), clock)).toBe(true);
    expect(isPastStart(at(10, 29), clock)).toBe(true);
  });

  it('accepts the next quarter hour and later', () => {
    expect(isPastStart(at(10, 30), clock)).toBe(false);
    expect(isPastStart(at(15, 0), clock)).toBe(false);
  });

  it('accepts exactly now when now is on a quarter hour', () => {
    expect(isPastStart(at(10, 15), at(10, 15))).toBe(false);
    expect(isPastStart(at(10, 0), at(10, 15))).toBe(true);
  });

  it('treats any earlier day as past and any later day as free', () => {
    expect(isPastStart(at(21, 0, 0, 0, 16), clock)).toBe(true);
    expect(isPastStart(at(9, 0, 0, 0, 18), clock)).toBe(false);
  });
});

describe('the injectable clock', () => {
  it('uses the real clock until one is injected, then goes back', () => {
    const fixed = at(8, 0);
    setClock(() => fixed);
    expect(now()).toBe(fixed);
    setClock(null);
    expect(Math.abs(now().getTime() - Date.now())).toBeLessThan(1000);
  });
});

const doctor: Doctor = {
  id: 'dr-1',
  name: { ar: 'د. تجربة', en: 'Dr. Test' },
  specialtyKey: 'internal',
  specialty: { ar: 'باطنة', en: 'Internal' },
  colorToken: 'doctor-1',
  workStart: '09:00',
  workEnd: '21:00',
  active: true,
};
const base = { doctorId: 'dr-1', patientId: 'pt-1', durationMin: 30 };

describe('findConflicts with a clock', () => {
  it('flags a past start only when `now` is given', () => {
    expect(findConflicts({ ...base, start: at(10, 0) }, [], doctor)).toEqual([]);
    expect(findConflicts({ ...base, start: at(10, 0) }, [], doctor, { now: at(12, 0) })).toEqual([
      { code: 'past_time' },
    ]);
    expect(findConflicts({ ...base, start: at(12, 15) }, [], doctor, { now: at(12, 0) })).toEqual(
      [],
    );
  });
});

describe('slots with a clock', () => {
  const none: Appointment[] = [];
  const query = { date: at(0), doctor, durationMin: 30, appointments: none, patientId: null };

  it('offers only start times from the next quarter hour today', () => {
    const slots = generateSlots({ ...query, now: at(12, 20) }).filter((s) => s.free);
    expect(slots[0]?.start).toEqual(at(12, 30));
    expect(slots.at(-1)?.start).toEqual(at(20, 30));
  });

  it('offers nothing when the working day is over', () => {
    expect(generateSlots({ ...query, now: at(20, 40) }).filter((s) => s.free)).toEqual([]);
    expect(generateSlots({ ...query, now: at(23, 0) }).filter((s) => s.free)).toEqual([]);
  });

  it('offers the whole day on a later date', () => {
    const tomorrow = at(0, 0, 0, 0, 18);
    expect(
      generateSlots({ ...query, date: tomorrow, now: at(23, 0) }).filter((s) => s.free),
    ).toHaveLength(47);
  });

  it('never suggests a time in the past', () => {
    const suggestions = suggestSlots({ ...query, target: at(9, 0), now: at(12, 20) });
    expect(suggestions.every((s) => s >= at(12, 30))).toBe(true);
    expect(suggestions[0]).toEqual(at(12, 30));
  });
});
