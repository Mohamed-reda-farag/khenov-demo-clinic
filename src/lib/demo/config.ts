export const DEMO_PREFIX = 'khenov-demo';
export const APP_ID = 'clinic';
/** Bump to force every visitor's local data to be re-seeded. */
export const SEED_VERSION = 4;

/**
 * `?demo=` takes one or more switches separated by commas:
 * - `fast`: no simulated network delay (for recording videos)
 * - `error`: the first load of every list fails, so each screen's error state (and its Retry) can be shown
 * - `empty`: starts from a clean clinic with no patients, appointments or notifications (kept in its own storage)
 */
export function parseDemoFlags(search: string): Set<string> {
  const value = new URLSearchParams(search).get('demo') ?? '';
  return new Set(
    value
      .split(',')
      .map((flag) => flag.trim().toLowerCase())
      .filter(Boolean),
  );
}

const FLAGS =
  typeof window === 'undefined' ? new Set<string>() : parseDemoFlags(window.location.search);

export const FAST_MODE = FLAGS.has('fast');
export const ERROR_MODE = FLAGS.has('error');
export const EMPTY_MODE = FLAGS.has('empty');

export const NAMESPACE = `${DEMO_PREFIX}:${APP_ID}:v${SEED_VERSION}${EMPTY_MODE ? '-empty' : ''}`;
/** Preferences (language, theme, sidebar) live outside the versioned namespace so Reset keeps them. */
export const PREFS_NAMESPACE = `${DEMO_PREFIX}:${APP_ID}:prefs`;

const VERSIONED_KEY = new RegExp(`^${DEMO_PREFIX}:${APP_ID}:v(\\d+)(?:-empty)?:`);

/** True for data written by an older SEED_VERSION (the normal and the `empty` copies are purged alike). */
export function isStaleNamespaceKey(key: string): boolean {
  const match = VERSIONED_KEY.exec(key);
  return match !== null && Number(match[1]) !== SEED_VERSION;
}
