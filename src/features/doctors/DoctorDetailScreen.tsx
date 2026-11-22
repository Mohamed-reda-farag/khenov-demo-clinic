import { ArrowRight, Pencil, UserX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DOCTOR_DOT } from '@/features/appointments/statusStyles';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { WeekSchedule } from '@/features/calendar/WeekSchedule';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import type { Doctor } from '@/data/types';
import { ActiveBadge, DoctorHours, DoctorLoad } from './DoctorsScreen';
import { DoctorFormDialog } from './DoctorFormDialog';

export function DoctorDetailScreen() {
  const { t } = useTranslation();
  const localize = useLocalized();
  const { id } = useParams();
  const status = useDataStatus();
  const reload = useReloadData();
  const { doctorById } = useCatalogMaps();
  const [editing, setEditing] = useState<Doctor | null>(null);
  const doctor = id ? doctorById.get(id) : undefined;

  if (status === 'error') {
    return (
      <ErrorState
        title={t('doctors.errorTitle')}
        description={t('doctors.errorDescription')}
        onRetry={reload}
      />
    );
  }
  if (status !== 'ready') {
    return (
      <div className="flex flex-col gap-4 p-6" aria-busy>
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }
  if (!doctor) {
    return (
      <EmptyState
        icon={UserX}
        title={t('doctors.notFoundTitle')}
        description={t('doctors.notFoundDescription')}
        action={
          <Link to="/doctors" className={buttonStyles('secondary')}>
            {t('doctors.back')}
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <Link
        to="/doctors"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
        {t('doctors.back')}
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span aria-hidden className={cn('size-3 rounded-full', DOCTOR_DOT[doctor.colorToken])} />
          <div>
            <h1 className="text-2xl font-semibold text-fg">{localize(doctor.name)}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{localize(doctor.specialty)}</span>
              <DoctorHours doctor={doctor} />
              <ActiveBadge active={doctor.active} />
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="w-64">
            <DoctorLoad doctor={doctor} />
          </div>
          <Button variant="secondary" onClick={() => setEditing(doctor)}>
            <Pencil className="size-4" aria-hidden />
            {t('doctors.edit')}
          </Button>
        </div>
      </header>
      <WeekSchedule doctorId={doctor.id} />
      <DoctorFormDialog doctor={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
