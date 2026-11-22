import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { CalendarX2 } from 'lucide-react';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { DoctorSchedule } from '@/features/calendar/DoctorSchedule';
import { useSessionStore } from '@/stores/sessionStore';

/** The logged-in doctor's own schedule (week or day). Appointments open with the same actions as "My day". */
export function MyScheduleScreen() {
  const { t } = useTranslation();
  const status = useDataStatus();
  const reload = useReloadData();
  const doctorId = useSessionStore((state) => state.session?.doctorId ?? null);

  if (status === 'error') {
    return (
      <ErrorState
        title={t('mySchedule.errorTitle')}
        description={t('mySchedule.errorDescription')}
        onRetry={reload}
      />
    );
  }
  if (status !== 'ready') {
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy>
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!doctorId) {
    return (
      <EmptyState
        icon={CalendarX2}
        title={t('mySchedule.emptyTitle')}
        description={t('mySchedule.emptyDescription')}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <PageHeader title={t('mySchedule.title')} subtitle={t('mySchedule.subtitle')} />
      <DoctorSchedule doctorId={doctorId} />
    </div>
  );
}
