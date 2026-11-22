import { addDays, eachDayOfInterval, startOfDay, startOfWeek } from 'date-fns';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from '@/lib/scheduling/constants';

export type RangeKey = '7d' | '30d' | 'week';

export interface DateRange {
  from: Date;
  /** Start of the last day (inclusive). */
  to: Date;
  days: Date[];
}

/** Last 7 or 30 days ending today, or the current week (Saturday to Friday). */
export function resolveRange(key: RangeKey, now: Date): DateRange {
  const today = startOfDay(now);
  let from: Date;
  let to: Date;
  if (key === 'week') {
    from = startOfWeek(today, { weekStartsOn: 6 });
    to = addDays(from, 6);
  } else {
    to = today;
    from = addDays(today, key === '7d' ? -6 : -29);
  }
  return { from, to, days: eachDayOfInterval({ start: from, end: to }) };
}

/** Everything in a report that does not depend on which doctors exist. */
export interface ScopedReportData {
  total: number;
  done: number;
  cancelled: number;
  /** Patients who did not attend. Counted separately from cancellations. */
  noShow: number;
  /** 0 to 1. */
  cancellationRate: number;
  /** 0 to 1. */
  noShowRate: number;
  /** Every appointment that starts on the day (any status). */
  byDay: Array<{ date: Date; count: number }>;
  byStatus: Record<AppointmentStatus, number>;
  /** Hours of the calendar grid; cancelled appointments are not counted. */
  byHour: Array<{ hour: number; count: number }>;
  /** Services, most booked first; cancelled appointments are not counted. */
  byService: Array<{ serviceId: string; count: number }>;
  busiestHour: number | null;
}

export interface ReportData extends ScopedReportData {
  /** Cancelled appointments are not counted. */
  byDoctor: Array<{ doctorId: string; count: number }>;
  busiestDoctorId: string | null;
}

/** One doctor's own report: no other doctor and no clinic-wide comparison in it. */
export interface DoctorReportData extends ScopedReportData {
  /** Days of the range on which the doctor has at least one (not cancelled) appointment. */
  workingDays: number;
  /** Not cancelled appointments divided by working days (0 when there are none). */
  avgPerWorkingDay: number;
}

const STATUSES: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'arrived',
  'done',
  'cancelled',
  'no_show',
];
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const peak = <T extends { count: number }>(items: T[]) =>
  items.reduce<T | null>((best, item) => (item.count > (best?.count ?? 0) ? item : best), null);

/** The appointments that start on a day of the range. */
function inRange(appointments: readonly Appointment[], range: DateRange): Appointment[] {
  const days = new Set(range.days.map(dayKey));
  return appointments.filter((a) => days.has(dayKey(new Date(a.start))));
}

function aggregate(appointments: readonly Appointment[], range: DateRange): ScopedReportData {
  const days = new Map(range.days.map((date) => [dayKey(date), 0]));
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    AppointmentStatus,
    number
  >;
  const hours = new Map<number, number>();
  for (let hour = CALENDAR_START_HOUR; hour < CALENDAR_END_HOUR; hour += 1) hours.set(hour, 0);
  const services = new Map<string, number>();
  const scoped = inRange(appointments, range);

  for (const appointment of scoped) {
    const start = new Date(appointment.start);
    const key = dayKey(start);
    days.set(key, (days.get(key) ?? 0) + 1);
    byStatus[appointment.status] += 1;
    if (appointment.status === 'cancelled') continue;
    if (hours.has(start.getHours()))
      hours.set(start.getHours(), (hours.get(start.getHours()) ?? 0) + 1);
    services.set(appointment.serviceId, (services.get(appointment.serviceId) ?? 0) + 1);
  }

  const total = scoped.length;
  const byHour = [...hours].map(([hour, count]) => ({ hour, count }));
  return {
    total,
    done: byStatus.done,
    cancelled: byStatus.cancelled,
    noShow: byStatus.no_show,
    cancellationRate: total === 0 ? 0 : byStatus.cancelled / total,
    noShowRate: total === 0 ? 0 : byStatus.no_show / total,
    byDay: range.days.map((date) => ({ date, count: days.get(dayKey(date)) ?? 0 })),
    byStatus,
    byHour,
    byService: [...services]
      .map(([serviceId, count]) => ({ serviceId, count }))
      .sort((a, b) => b.count - a.count || a.serviceId.localeCompare(b.serviceId)),
    busiestHour: peak(byHour)?.hour ?? null,
  };
}

/** The clinic-wide report (receptionist). */
export function buildReport(
  appointments: readonly Appointment[],
  range: DateRange,
  doctorIds: readonly string[],
): ReportData {
  const doctors = new Map(doctorIds.map((id) => [id, 0]));
  for (const appointment of inRange(appointments, range)) {
    if (appointment.status === 'cancelled') continue;
    doctors.set(appointment.doctorId, (doctors.get(appointment.doctorId) ?? 0) + 1);
  }
  const byDoctor = [...doctors].map(([doctorId, count]) => ({ doctorId, count }));
  return {
    ...aggregate(appointments, range),
    byDoctor,
    busiestDoctorId: peak(byDoctor)?.doctorId ?? null,
  };
}

/**
 * One doctor's report: the same aggregation over that doctor's appointments only. Appointments of
 * other doctors never enter the calculation, and the result carries nothing about other doctors.
 */
export function buildDoctorReport(
  appointments: readonly Appointment[],
  range: DateRange,
  doctorId: string,
): DoctorReportData {
  const mine = appointments.filter((a) => a.doctorId === doctorId);
  const booked = inRange(mine, range).filter((a) => a.status !== 'cancelled');
  const workingDays = new Set(booked.map((a) => dayKey(new Date(a.start)))).size;
  return {
    ...aggregate(mine, range),
    workingDays,
    avgPerWorkingDay: workingDays === 0 ? 0 : booked.length / workingDays,
  };
}
