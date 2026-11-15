import { demoStorage, purgeStaleNamespaces } from './storage';

const SEEDED_KEY = '__seeded__';

export type SeedBuilder = () => Record<string, unknown>;

/** Writes seed collections once per SEED_VERSION. Older versions are purged. */
export function seedIfNeeded(build: SeedBuilder): void {
  purgeStaleNamespaces();
  if (demoStorage.get<boolean>(SEEDED_KEY, false)) return;
  Object.entries(build()).forEach(([key, value]) => demoStorage.set(key, value));
  demoStorage.set(SEEDED_KEY, true);
}

/** Clears the demo namespace and seeds it again. The caller shows the confirm dialog first. */
export function resetDemo(build: SeedBuilder): void {
  demoStorage.clear();
  seedIfNeeded(build);
}
