import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AppointmentStatus } from '@/data/types';

/** Order of the status slices in the donut (the same in every report). */
export const STATUS_ORDER: AppointmentStatus[] = [
  'pending',
  'confirmed',
  'arrived',
  'done',
  'cancelled',
  'no_show',
];

/** Full class names so Tailwind generates them. */
export const STATUS_CHART: Record<AppointmentStatus, { stroke: string; dot: string }> = {
  pending: { stroke: 'stroke-status-pending', dot: 'bg-status-pending' },
  confirmed: { stroke: 'stroke-status-confirmed', dot: 'bg-status-confirmed' },
  arrived: { stroke: 'stroke-status-arrived', dot: 'bg-status-arrived' },
  done: { stroke: 'stroke-status-done', dot: 'bg-status-done' },
  cancelled: { stroke: 'stroke-status-cancelled', dot: 'bg-status-cancelled' },
  no_show: { stroke: 'stroke-status-no-show', dot: 'bg-status-no-show' },
};

export function Kpi({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="anim-rise-in flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="text-sm text-muted">{label}</p>
      </div>
      <p className="truncate text-3xl font-semibold text-fg">{value}</p>
      {hint && <p className="-mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}
