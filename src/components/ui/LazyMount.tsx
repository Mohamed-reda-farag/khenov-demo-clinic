import { Suspense, useState, type ReactNode } from 'react';

/**
 * Mounts `children` (usually a React.lazy dialog) the first time `when` becomes true and keeps it
 * mounted afterwards, so the dialog's chunk loads on demand and its closing animation still plays.
 */
export function LazyMount({ when, children }: { when: boolean; children: ReactNode }) {
  const [wanted, setWanted] = useState(when);
  if (when && !wanted) setWanted(true);
  return wanted ? <Suspense fallback={null}>{children}</Suspense> : null;
}
