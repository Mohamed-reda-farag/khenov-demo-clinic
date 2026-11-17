import { useTranslation } from 'react-i18next';
import type { AppointmentStatus } from '@/data/types';
import { cn } from '@/lib/cn';
import { STATUS_STYLES } from './statusStyles';

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        STATUS_STYLES[status].badge,
        className,
      )}
    >
      <span aria-hidden className={cn('size-2 rounded-full', STATUS_STYLES[status].dot)} />
      {t(`appointment.status.${status}`)}
    </span>
  );
}
