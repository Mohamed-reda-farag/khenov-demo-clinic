import type { ReactNode } from 'react';

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      dir="ltr"
      className="inline-flex min-w-6 items-center justify-center rounded-sm border border-line bg-sunken px-2 text-xs font-medium text-muted"
    >
      {children}
    </kbd>
  );
}
