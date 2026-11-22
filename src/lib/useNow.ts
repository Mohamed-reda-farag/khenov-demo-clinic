import { useEffect, useState } from 'react';
import { now as clockNow } from './clock';

/** The current time, refreshed every `intervalMs`. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => clockNow());
  useEffect(() => {
    const id = setInterval(() => setNow(clockNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
