import { describe, expect, it } from 'vitest';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { buildDoctorReport, buildReport, resolveRange } from './aggregate';

const now = new Date(2026, 10, 17, 12, 0); // Tuesday

function at(day: number, hour: number, status: AppointmentStatus, doctorId = 'dr-1'): Appointment {
  return {
    id: `ap-${day}-${hour}-${doctorId}-${status}`,
    patientId: 'pt-1',
    doctorId,
    serviceId: 'sv-1',
    start: new Date(2026, 10, day, hour, 0).toISOString(),
    durationMin: 30,
    status,
    visitNote: null,
    cancelReason: null,
  };
}

describe('resolveRange', () => {
  it('covers the last 7 or 30 days ending today', () => {
    const week = resolveRange('7d', now);
    expect(week.days).toHaveLength(7);
    expect(week.days[0]?.getDate()).toBe(11);
    expect(week.to.getDate()).toBe(17);
    expect(resolveRange('30d', now).days).toHaveLength(30);
  });

  it('uses Saturday to Friday for "this week"', () => {
    const { days } = resolveRange('week', now);
    expect(days).toHaveLength(7);
    expect(days[0]?.getDay()).toBe(6);
    expect(days[0]?.getDate()).toBe(14);
    expect(days[6]?.getDate()).toBe(20);
  });
});

describe('buildReport', () => {
  const range = resolveRange('7d', now);
  const items = [
    at(17, 10, 'done'),
    at(17, 10, 'done', 'dr-2'),
    at(17, 11, 'cancelled'),
    at(16, 14, 'confirmed', 'dr-2'),
    at(1, 10, 'done'), // outside the range
  ];
  const report = buildReport(items, range, ['dr-1', 'dr-2']);

  it('counts only appointments inside the range', () => {
    expect(report.total).toBe(4);
    expect(report.byDay.map((d) => d.count)).toEqual([0, 0, 0, 0, 0, 1, 3]);
  });

  it('splits by status and computes the cancellation rate', () => {
    expect(report.byStatus).toEqual({
      pending: 0,
      confirmed: 1,
      arrived: 0,
      done: 2,
      cancelled: 1,
      no_show: 0,
    });
    expect(report.cancellationRate).toBeCloseTo(0.25);
    expect(report.noShowRate).toBe(0);
  });

  it('counts no-shows separately from cancellations', () => {
    const withNoShows = buildReport(
      [
        ...items,
        at(16, 9, 'no_show'),
        at(15, 9, 'no_show', 'dr-2'),
        at(15, 10, 'cancelled', 'dr-2'),
      ],
      range,
      ['dr-1', 'dr-2'],
    );
    expect(withNoShows.total).toBe(7);
    expect(withNoShows.noShow).toBe(2);
    expect(withNoShows.cancelled).toBe(2);
    expect(withNoShows.byStatus.no_show).toBe(2);
    expect(withNoShows.noShowRate).toBeCloseTo(2 / 7);
    expect(withNoShows.cancellationRate).toBeCloseTo(2 / 7);
    // A no-show still occupied its slot: it counts for the busiest hours, a cancellation does not.
    expect(withNoShows.byHour.find((h) => h.hour === 9)?.count).toBe(2);
  });

  it('ignores cancelled appointments for busiest hours and doctors', () => {
    expect(report.byHour.find((h) => h.hour === 11)?.count).toBe(0);
    expect(report.busiestHour).toBe(10);
    expect(report.byDoctor).toEqual([
      { doctorId: 'dr-1', count: 1 },
      { doctorId: 'dr-2', count: 2 },
    ]);
    expect(report.busiestDoctorId).toBe('dr-2');
  });

  it('is calm about an empty range', () => {
    const empty = buildReport([], range, ['dr-1']);
    expect(empty).toMatchObject({
      total: 0,
      cancellationRate: 0,
      noShowRate: 0,
      busiestHour: null,
      busiestDoctorId: null,
    });
  });
});

describe('buildDoctorReport', () => {
  const range = resolveRange('7d', now);
  const items = [
    at(17, 10, 'done'),
    at(17, 11, 'cancelled'),
    at(17, 14, 'no_show'),
    at(16, 9, 'confirmed'),
    at(16, 10, 'done', 'dr-2'),
    at(15, 10, 'done', 'dr-2'),
    at(15, 11, 'cancelled', 'dr-2'),
    at(14, 12, 'done', 'dr-3'),
    at(1, 10, 'done'), // outside the range
  ];
  const mine = buildDoctorReport(items, range, 'dr-1');

  it("equals the clinic-wide aggregation of that doctor's subset (same pure functions)", () => {
    const subset = buildReport(
      items.filter((a) => a.doctorId === 'dr-1'),
      range,
      ['dr-1'],
    );
    const { byDoctor: _byDoctor, busiestDoctorId: _busiest, ...expected } = subset;
    expect(_byDoctor).toHaveLength(1);
    expect(_busiest).toBe('dr-1');
    expect(mine).toMatchObject(expected);
  });

  it('agrees with the clinic-wide report for the same doctor', () => {
    const clinic = buildReport(items, range, ['dr-1', 'dr-2', 'dr-3']);
    // The clinic-wide "by doctor" counts everything except cancelled.
    expect(clinic.byDoctor.find((d) => d.doctorId === 'dr-1')?.count).toBe(
      mine.total - mine.cancelled,
    );
    expect(clinic.total).toBeGreaterThan(mine.total);
  });

  it('never contains other doctors', () => {
    expect(mine.total).toBe(4);
    expect(mine.byStatus).toMatchObject({ done: 1, cancelled: 1, no_show: 1, confirmed: 1 });
    expect(Object.keys(mine)).not.toContain('byDoctor');
    expect(Object.keys(mine)).not.toContain('busiestDoctorId');
    expect(buildDoctorReport(items, range, 'dr-9').total).toBe(0);
  });

  it('counts no-shows separately and computes the average per working day', () => {
    expect(mine.noShow).toBe(1);
    expect(mine.cancelled).toBe(1);
    expect(mine.noShowRate).toBeCloseTo(0.25);
    // Working days: 16 and 17 (cancelled does not make a working day by itself); 3 booked in 2 days.
    expect(mine.workingDays).toBe(2);
    expect(mine.avgPerWorkingDay).toBeCloseTo(1.5);
  });

  it('lists services most booked first, without cancelled ones', () => {
    expect(mine.byService).toEqual([{ serviceId: 'sv-1', count: 3 }]);
    expect(buildDoctorReport([], range, 'dr-1')).toMatchObject({
      total: 0,
      workingDays: 0,
      avgPerWorkingDay: 0,
      byService: [],
    });
  });
});
