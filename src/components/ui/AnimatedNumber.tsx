import { useCountUp } from '@/lib/useCountUp';

/** A number that counts up. Screen readers get the final value only (no tick-by-tick announcements). */
export function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format: (value: number) => string;
}) {
  const shown = useCountUp(value);
  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
