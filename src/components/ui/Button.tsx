import { Loader2 } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-sunken',
  ghost: 'text-muted hover:bg-sunken hover:text-fg',
  danger: 'bg-danger text-on-danger hover:opacity-90',
};

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'press inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold select-none disabled:opacity-50',
        VARIANTS[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="spinner size-4" aria-hidden />}
      {children}
    </button>
  );
}
