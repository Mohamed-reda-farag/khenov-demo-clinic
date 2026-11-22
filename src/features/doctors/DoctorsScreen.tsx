import { CalendarRange, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Doctor } from '@/data/types';
import { DOCTOR_DOT } from '@/features/appointments/statusStyles';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { doctorLoad } from '@/lib/scheduling/load';
import { atTime } from '@/lib/scheduling/time';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { DoctorFormDialog } from './DoctorFormDialog';
import { now } from '@/lib/clock';

export function ActiveBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        active ? 'bg-status-done-soft text-status-done' : 'bg-sunken text-muted',
      )}
    >
      <span
        aria-hidden
        className={cn('size-2 rounded-full', active ? 'bg-status-done' : 'bg-subtle')}
      />
      {active ? t('doctors.active') : t('doctors.inactive')}
    </span>
  );
}

export function DoctorLoad({ doctor }: { doctor: Doctor }) {
  const { t } = useTranslation();
  const format = useFormat();
  const now = useNow();
  const appointments = useAppointmentsStore((state) => state.items);
  const load = doctorLoad(appointments, doctor, now);
  const summary = t('dashboard.load.booked', {
    booked: format.duration(load.bookedMin),
    total: format.duration(load.workMin),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted">{t('doctors.todayLoad')}</span>
        <span className="text-lg font-semibold text-fg">
          {format.number(load.count)}{' '}
          <span className="text-xs font-normal text-muted">{t('dashboard.load.appointments')}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={t('doctors.todayLoad')}
        aria-valuemin={0}
        aria-valuemax={load.workMin}
        aria-valuenow={load.bookedMin}
        aria-valuetext={summary}
        className="h-2 overflow-hidden rounded-full bg-sunken"
      >
        <div
          className={cn('h-full rounded-full', DOCTOR_DOT[doctor.colorToken])}
          style={{ width: `${Math.min(100, (load.bookedMin / Math.max(1, load.workMin)) * 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted">{load.count === 0 ? t('dashboard.load.empty') : summary}</p>
    </div>
  );
}

export function DoctorHours({ doctor }: { doctor: Doctor }) {
  const { t } = useTranslation();
  const format = useFormat();
  const today = now();
  return (
    <span>
      {t('doctors.hours', {
        from: format.time(atTime(today, doctor.workStart)),
        to: format.time(atTime(today, doctor.workEnd)),
      })}
    </span>
  );
}

export function DoctorsScreen() {
  const { t } = useTranslation();
  const localize = useLocalized();
  const status = useDataStatus();
  const reload = useReloadData();
  const doctors = useCatalogStore((state) => state.doctors);
  const [editing, setEditing] = useState<Doctor | null>(null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title={t('doctors.title')} subtitle={t('doctors.subtitle')} />
      {status === 'error' ? (
        <ErrorState
          title={t('doctors.errorTitle')}
          description={t('doctors.errorDescription')}
          onRetry={reload}
        />
      ) : status !== 'ready' ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy>
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-56" />
          ))}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {doctors.map((doctor, index) => (
            <li
              key={doctor.id}
              className="anim-rise-in flex flex-col gap-5 rounded-lg border border-line bg-surface p-6 shadow-sm"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      'flex size-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-on-primary',
                      DOCTOR_DOT[doctor.colorToken],
                    )}
                  >
                    {localize(doctor.name)
                      .replace(/^(د\.|Dr\.)\s*/, '')
                      .charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-fg">
                      {localize(doctor.name)}
                    </h2>
                    <p className="truncate text-sm text-muted">{localize(doctor.specialty)}</p>
                  </div>
                </div>
                <ActiveBadge active={doctor.active} />
              </div>
              <p className="text-sm text-muted">
                <DoctorHours doctor={doctor} />
              </p>
              <DoctorLoad doctor={doctor} />
              <div className="mt-auto flex flex-wrap gap-2">
                <Link to={`/doctors/${doctor.id}`} className={buttonStyles('primary')}>
                  <CalendarRange className="size-4" aria-hidden />
                  {t('doctors.viewSchedule')}
                </Link>
                <Button variant="secondary" onClick={() => setEditing(doctor)}>
                  <Pencil className="size-4" aria-hidden />
                  {t('doctors.edit')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DoctorFormDialog doctor={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}
