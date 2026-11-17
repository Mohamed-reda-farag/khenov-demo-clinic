/** Wall-clock helpers (local time). Built with the Date constructor so DST never shifts a slot. */

export function atMinutes(day: Date, minutesFromMidnight: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutesFromMidnight);
}

/** `'09:30'` on the given day. */
export function atTime(day: Date, hm: string): Date {
  const [hours = 0, minutes = 0] = hm.split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);
}

export function endOf(start: Date, durationMin: number): Date {
  return new Date(start.getTime() + durationMin * 60_000);
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function snapMinutes(minutes: number, step: number): number {
  return Math.round(minutes / step) * step;
}
