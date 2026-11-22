/**
 * The one place that decides what "now" is.
 *
 * It is the real clock. Appointments are seeded relative to today and shifted forward when the demo
 * is opened on a later day, so "today" always has appointments, but the time of day is real: for
 * today's date a start time earlier than the current clock time is in the past. Tests can inject a
 * fixed clock with `setClock`.
 */
let source: (() => Date) | null = null;

export function now(): Date {
  return source ? source() : new Date();
}

/** Tests only: pass `null` to go back to the real clock. */
export function setClock(next: (() => Date) | null): void {
  source = next;
}
