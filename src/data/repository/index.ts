import { buildSeed } from '@/data/seed';
import type { Appointment } from '@/data/types';
import { daysSinceAnchor, formatAnchor, shiftAppointments } from '@/lib/scheduling/anchor';
import { EMPTY_MODE } from '@/lib/demo/config';
import { resetDemo, seedIfNeeded } from '@/lib/demo/seeding';
import { demoStorage } from '@/lib/demo/storage';
import { localRepositories } from './local';
import { now } from '@/lib/clock';

/** The only data entry point for the UI. Swap `localRepositories` to change the data source. */
export const repositories = localRepositories;

/**
 * Keeps "today" meaningful when the demo is opened on a later day: the saved appointments
 * move by the same whole number of days, so the seeded day always lines up with today.
 */
function reanchorAppointments(today: Date): void {
  const anchor = demoStorage.get<string>('anchor', formatAnchor(today));
  const days = daysSinceAnchor(anchor, today);
  if (days === 0) return;
  const items = demoStorage.get<Appointment[]>('appointments', []);
  demoStorage.set('appointments', shiftAppointments(items, days));
  demoStorage.set('anchor', formatAnchor(today));
}

export function initData(): void {
  const today = now();
  seedIfNeeded(() => buildSeed(today, EMPTY_MODE));
  reanchorAppointments(today);
}

export function resetData(): void {
  resetDemo(() => buildSeed(now(), EMPTY_MODE));
}
