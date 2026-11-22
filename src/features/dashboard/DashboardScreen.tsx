import {
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  Hourglass,
  Plus,
  UserCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/features/appointments/StatusBadge';
import { DOCTOR_DOT } from '@/features/appointments/statusStyles';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { doctorLoad } from '@/lib/scheduling/load';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useUiStore } from '@/stores/uiStore';

const UPCOMING_LIMIT = 6;

function StatCard({
  format,
  icon: Icon,
  label,
  value,
  hint,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: number | null;
  hint?: string;
  index: number;
  format: { number: (value: number) => string };
}) {
  return (
    <div
      className="anim-rise-in flex flex-col gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="text-sm text-muted">{label}</p>
      </div>
      {value === null ? (
        <Skeleton className="h-9 w-16" />
      ) : (
        <p className="text-3xl font-semibold text-fg">
          <AnimatedNumber value={value} format={format.number} />
        </p>
      )}
      {hint && <p className="-mt-1 text-xs text-subtle">{hint}</p>}
    </div>
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const status = useDataStatus();
  const reload = useReloadData();
  const { doctorById, patientById, serviceById } = useCatalogMaps();
  const doctors = useCatalogStore((state) => state.doctors);
  const appointments = useAppointmentsStore((state) => state.items);
  const openForm = useUiStore((state) => state.openForm);
  const openDetail = useUiStore((state) => state.openDetail);
  const ready = status === 'ready';

  const today = useMemo(
    () => appointments.filter((a) => new Date(a.start).toDateString() === now.toDateString()),
    [appointments, now],
  );
  const count = (s: string) => today.filter((a) => a.status === s).length;
  const upcoming = useMemo(
    () =>
      today
        .filter((a) => ['pending', 'confirmed', 'arrived'].includes(a.status))
        .slice(0, UPCOMING_LIMIT),
    [today],
  );

  const stats: Array<{ icon: LucideIcon; label: string; value: number; hint?: string }> = [
    {
      icon: CalendarCheck,
      label: t('dashboard.stats.total'),
      value: today.length,
      hint: t('dashboard.stats.totalDone', { count: format.number(count('done')) }),
    },
    { icon: CalendarCheck2, label: t('dashboard.stats.confirmed'), value: count('confirmed') },
    { icon: UserCheck, label: t('dashboard.stats.arrived'), value: count('arrived') },
    { icon: Hourglass, label: t('dashboard.stats.pending'), value: count('pending') },
    { icon: CalendarX2, label: t('dashboard.stats.cancelled'), value: count('cancelled') },
    { icon: UserX, label: t('dashboard.stats.noShow'), value: count('no_show') },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={format.date(now)}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/calendar" className={buttonStyles('secondary')}>
              <CalendarDays className="size-4" aria-hidden />
              {t('dashboard.actions.openCalendar')}
            </Link>
            <Button onClick={() => openForm({ mode: 'create' })}>
              <Plus className="size-4" aria-hidden />
              {t('dashboard.actions.newAppointment')}
            </Button>
          </div>
        }
      />

      {status === 'error' ? (
        <ErrorState
          title={t('dashboard.errorTitle')}
          description={t('dashboard.errorDescription')}
          onRetry={reload}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.label}
                index={index}
                format={format}
                icon={stat.icon}
                label={stat.label}
                value={ready ? stat.value : null}
                hint={ready ? stat.hint : undefined}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <section
              aria-labelledby="upcoming-title"
              className="rounded-lg border border-line bg-surface shadow-sm"
            >
              <div className="border-b border-line p-4">
                <h2 id="upcoming-title" className="text-lg font-semibold text-fg">
                  {t('dashboard.upcoming.title')}
                </h2>
                <p className="text-sm text-muted">{t('dashboard.upcoming.subtitle')}</p>
              </div>
              {!ready ? (
                <div className="flex flex-col gap-3 p-4">
                  {[0, 1, 2, 3].map((row) => (
                    <Skeleton key={row} className="h-14" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title={t('dashboard.upcoming.emptyTitle')}
                  description={t('dashboard.upcoming.emptyDescription')}
                  action={
                    <Button onClick={() => openForm({ mode: 'create' })}>
                      <Plus className="size-4" aria-hidden />
                      {t('dashboard.actions.newAppointment')}
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y divide-line">
                  {upcoming.map((appointment) => {
                    const patient = patientById.get(appointment.patientId);
                    const doctor = doctorById.get(appointment.doctorId);
                    const service = serviceById.get(appointment.serviceId);
                    return (
                      <li key={appointment.id}>
                        <button
                          type="button"
                          onClick={() => openDetail(appointment.id)}
                          className="flex min-h-14 w-full items-center gap-4 p-4 text-start hover:bg-sunken"
                        >
                          <span className="w-20 shrink-0 text-sm font-semibold text-fg">
                            {format.time(appointment.start)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-fg">
                              {patient ? localize(patient.name) : ''}
                            </span>
                            <span className="flex items-center gap-2 truncate text-xs text-muted">
                              {doctor && (
                                <span
                                  aria-hidden
                                  className={cn(
                                    'size-2 shrink-0 rounded-full',
                                    DOCTOR_DOT[doctor.colorToken],
                                  )}
                                />
                              )}
                              <span className="truncate">
                                {service ? localize(service.name) : t('common.deletedService')} ·{' '}
                                {doctor ? localize(doctor.name) : ''}
                              </span>
                            </span>
                          </span>
                          <StatusBadge status={appointment.status} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section
              aria-labelledby="load-title"
              className="rounded-lg border border-line bg-surface shadow-sm"
            >
              <div className="border-b border-line p-4">
                <h2 id="load-title" className="text-lg font-semibold text-fg">
                  {t('dashboard.load.title')}
                </h2>
              </div>
              <ul className="flex flex-col gap-5 p-4">
                {!ready
                  ? [0, 1, 2, 3].map((row) => (
                      <li key={row}>
                        <Skeleton className="h-12" />
                      </li>
                    ))
                  : doctors.map((doctor) => {
                      const load = doctorLoad(appointments, doctor, now);
                      const mine = { length: load.count };
                      const bookedMin = load.bookedMin;
                      const DAY_MINUTES = load.workMin;
                      return (
                        <li key={doctor.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex min-w-0 items-center gap-2">
                              <span
                                aria-hidden
                                className={cn(
                                  'size-2.5 shrink-0 rounded-full',
                                  DOCTOR_DOT[doctor.colorToken],
                                )}
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-fg">
                                  {localize(doctor.name)}
                                </span>
                                <span className="block truncate text-xs text-muted">
                                  {localize(doctor.specialty)}
                                </span>
                              </span>
                            </span>
                            <span className="shrink-0 text-end">
                              <span className="block text-lg font-semibold text-fg">
                                {format.number(mine.length)}
                              </span>
                              <span className="block text-xs text-muted">
                                {t('dashboard.load.appointments')}
                              </span>
                            </span>
                          </div>
                          <div
                            role="progressbar"
                            aria-label={localize(doctor.name)}
                            aria-valuemin={0}
                            aria-valuemax={DAY_MINUTES}
                            aria-valuenow={bookedMin}
                            aria-valuetext={t('dashboard.load.booked', {
                              booked: format.duration(bookedMin),
                              total: format.duration(DAY_MINUTES),
                            })}
                            className="h-2 overflow-hidden rounded-full bg-sunken"
                          >
                            <div
                              className={cn('h-full rounded-full', DOCTOR_DOT[doctor.colorToken])}
                              style={{
                                width: `${Math.min(100, (bookedMin / DAY_MINUTES) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted">
                            {mine.length === 0
                              ? t('dashboard.load.empty')
                              : t('dashboard.load.booked', {
                                  booked: format.duration(bookedMin),
                                  total: format.duration(DAY_MINUTES),
                                })}
                          </p>
                        </li>
                      );
                    })}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
