import { addDays, differenceInCalendarDays, format, parse } from 'date-fns';
import type { Appointment } from '@/data/types';

const ANCHOR_FORMAT = 'yyyy-MM-dd';

export function formatAnchor(day: Date): string {
  return format(day, ANCHOR_FORMAT);
}

/** Whole days between the day the demo was seeded and `today` (0 when they match). */
export function daysSinceAnchor(anchor: string, today: Date): number {
  return differenceInCalendarDays(today, parse(anchor, ANCHOR_FORMAT, new Date()));
}

/** Moves every appointment by whole days so "today" in the seed stays today. */
export function shiftAppointments(items: readonly Appointment[], days: number): Appointment[] {
  if (days === 0) return [...items];
  return items.map((item) => ({
    ...item,
    start: addDays(new Date(item.start), days).toISOString(),
  }));
}
