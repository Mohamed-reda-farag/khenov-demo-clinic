import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Counts from the last shown number up (or down) to `target`. Reduced motion jumps straight to it. */
export function useCountUp(target: number, durationMs = 700): number {
  const reduced = prefersReducedMotion();
  const [value, setValue] = useState(0);
  const shown = useRef(0);

  useEffect(() => {
    if (reduced) return;
    const from = shown.current;
    const started = performance.now();
    let frame = requestAnimationFrame(function step(time) {
      const progress = Math.min(1, (time - started) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      shown.current = Math.round(from + (target - from) * eased);
      setValue(shown.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);

  return reduced ? target : value;
}
