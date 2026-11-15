import { FAST_MODE } from './config';

/** Simulates network latency. Resolves immediately with `?demo=fast`. */
export function delay(min = 200, max = 600): Promise<void> {
  if (FAST_MODE) return Promise.resolve();
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
