import { NAMESPACE, PREFS_NAMESPACE, STALE_NAMESPACE_PREFIX } from './config';

function detectBackend(): Storage | null {
  try {
    const probe = '__khenov_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const backend = detectBackend();
const memory = new Map<string, string>();

function allKeys(): string[] {
  if (!backend) return [...memory.keys()];
  const keys: string[] = [];
  for (let i = 0; i < backend.length; i += 1) {
    const key = backend.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

function rawGet(key: string): string | null {
  try {
    return backend ? backend.getItem(key) : (memory.get(key) ?? null);
  } catch {
    return memory.get(key) ?? null;
  }
}

function rawSet(key: string, value: string): boolean {
  try {
    if (backend) backend.setItem(key, value);
    else memory.set(key, value);
    return true;
  } catch {
    memory.set(key, value);
    return false;
  }
}

function rawRemove(key: string): void {
  memory.delete(key);
  try {
    backend?.removeItem(key);
  } catch {
    /* storage unavailable: nothing to remove */
  }
}

export interface NamespacedStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): boolean;
  remove(key: string): void;
  clear(): void;
}

export function createNamespacedStorage(namespace: string): NamespacedStorage {
  const full = (key: string) => `${namespace}:${key}`;
  return {
    get<T>(key: string, fallback: T): T {
      const raw = rawGet(full(key));
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return fallback;
      }
    },
    set<T>(key: string, value: T): boolean {
      return rawSet(full(key), JSON.stringify(value));
    },
    remove(key: string): void {
      rawRemove(full(key));
    },
    clear(): void {
      const prefix = `${namespace}:`;
      allKeys()
        .filter((key) => key.startsWith(prefix))
        .forEach(rawRemove);
    },
  };
}

export const demoStorage = createNamespacedStorage(NAMESPACE);
export const prefsStorage = createNamespacedStorage(PREFS_NAMESPACE);

/** Removes data written by older SEED_VERSIONs. */
export function purgeStaleNamespaces(): void {
  const current = `${NAMESPACE}:`;
  allKeys()
    .filter((key) => key.startsWith(STALE_NAMESPACE_PREFIX) && !key.startsWith(current))
    .forEach(rawRemove);
}
