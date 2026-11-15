import { buildSeed } from '@/data/seed';
import { resetDemo, seedIfNeeded } from '@/lib/demo/seeding';
import { localRepositories } from './local';

/** The only data entry point for the UI. Swap `localRepositories` to change the data source. */
export const repositories = localRepositories;

export function initData(): void {
  seedIfNeeded(() => buildSeed(new Date()));
}

export function resetData(): void {
  resetDemo(() => buildSeed(new Date()));
}
