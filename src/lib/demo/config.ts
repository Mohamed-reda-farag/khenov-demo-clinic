export const DEMO_PREFIX = 'khenov-demo';
export const APP_ID = 'clinic';
/** Bump to force every visitor's local data to be re-seeded. */
export const SEED_VERSION = 1;

export const NAMESPACE = `${DEMO_PREFIX}:${APP_ID}:v${SEED_VERSION}`;
export const STALE_NAMESPACE_PREFIX = `${DEMO_PREFIX}:${APP_ID}:v`;
/** Preferences (language, theme, sidebar) live outside the versioned namespace so Reset keeps them. */
export const PREFS_NAMESPACE = `${DEMO_PREFIX}:${APP_ID}:prefs`;

/** `?demo=fast` disables simulated network delays (for recording videos). */
export const FAST_MODE =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demo') === 'fast';
