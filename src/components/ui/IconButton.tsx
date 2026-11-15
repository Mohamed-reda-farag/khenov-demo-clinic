import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps extends ComponentProps<'button'> {
  'aria-label': string;
}

export function IconButton({ className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'press inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-fg disabled:opacity-50',
        className,
      )}
      {...rest}
    />
  );
}
