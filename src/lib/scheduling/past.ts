import { SLOT_STEP_MIN } from './constants';

/**
 * The earliest start time that can still be booked: `now` rounded up to the next quarter hour
 * (exactly on a quarter hour stays as is). Anything earlier is "in the past".
 */
export function earliestBookable(now: Date, stepMin = SLOT_STEP_MIN): Date {
  const onBoundary =
    now.getMinutes() % stepMin === 0 && now.getSeconds() === 0 && now.getMilliseconds() === 0;
  const floored = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / stepMin) * stepMin,
  );
  return onBoundary ? floored : new Date(floored.getTime() + stepMin * 60_000);
}

/** True when a start time can no longer be booked or moved to. */
export function isPastStart(start: Date, now: Date): boolean {
  return start.getTime() < earliestBookable(now).getTime();
}
