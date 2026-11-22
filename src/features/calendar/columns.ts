import { addDays, eachDayOfInterval, startOfWeek } from 'date-fns';
import type { CalendarColumn } from './constants';

/** Egypt's week starts on Saturday. */
export const WEEK_STARTS_ON = 6;

export const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * The seven day columns of the week containing `anchor`. `doctorId` filters the appointments to one
 * doctor; `doctorIds` to several (a specialty).
 */
export function weekColumns(
  anchor: Date,
  doctorId: string | null,
  label: (date: Date) => string,
  doctorIds: readonly string[] | null = null,
): CalendarColumn[] {
  const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
  return eachDayOfInterval({ start, end: addDays(start, 6) }).map((date) => ({
    key: dayKey(date),
    label: label(date),
    date,
    doctorId,
    doctorIds,
  }));
}
