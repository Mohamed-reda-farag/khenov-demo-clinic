import { cn } from '@/lib/cn';

interface BrandMarkProps {
  name?: string;
  light?: boolean;
  className?: string;
}

/** Pulse-line logo mark. Pass `name` to show the wordmark next to it. */
export function BrandMark({ name, light = false, className }: BrandMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md',
          light ? 'bg-on-brand text-brand-1' : 'bg-primary text-on-primary',
        )}
      >
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden>
          <path
            d="M4 17h5l3-7 4 13 3-9 2 3h7"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {name && (
        <span className={cn('truncate text-lg font-semibold', light ? 'text-on-brand' : 'text-fg')}>
          {name}
        </span>
      )}
    </span>
  );
}
