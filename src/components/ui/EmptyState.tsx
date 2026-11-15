import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="anim-fade-in flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
        <Icon className="size-7" aria-hidden />
      </span>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
