import { ClipboardCheck, ClipboardList, StickyNote, UserCheck } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Appointment } from '@/data/types';
import { StatusBadge } from '@/features/appointments/StatusBadge';
import { VisitActions } from '@/features/appointments/VisitActions';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { isLockedStatus } from '@/lib/scheduling/status';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useSessionStore } from '@/stores/sessionStore';

function QueueItem({
  appointment,
  isNext,
  now,
}: {
  appointment: Appointment;
  isNext: boolean;
  now: Date;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const { patientById, serviceById } = useCatalogMaps();
  const patient = patientById.get(appointment.patientId);
  const service = serviceById.get(appointment.serviceId);

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-surface p-4 shadow-sm',
        isNext ? 'border-primary' : 'border-line',
      )}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className="w-20 shrink-0 text-lg font-semibold text-fg">
          {format.time(appointment.start)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-fg">
            <span className="truncate">
              {patient ? localize(patient.name) : t('common.unknownPatient')}
            </span>
            {isNext && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-strong">
                {t('myDay.next')}
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted">
            {service ? localize(service.name) : t('common.deletedService')} ·{' '}
            {format.duration(appointment.durationMin)}
          </p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      {appointment.visitNote && (
        <p className="flex items-start gap-2 rounded-md bg-sunken p-3 text-sm text-fg">
          <StickyNote className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span className="min-w-0 break-words">{appointment.visitNote}</span>
        </p>
      )}

      <VisitActions appointment={appointment} now={now} />
    </li>
  );
}

export function MyDayScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const status = useDataStatus();
  const reload = useReloadData();
  const doctorId = useSessionStore((state) => state.session?.doctorId ?? null);
  const { doctorById } = useCatalogMaps();
  const appointments = useAppointmentsStore((state) => state.items);
  const doctor = doctorId ? doctorById.get(doctorId) : undefined;

  const queue = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.doctorId === doctorId &&
            a.status !== 'cancelled' &&
            new Date(a.start).toDateString() === now.toDateString(),
        )
        .sort((a, b) => a.start.localeCompare(b.start)),
    [appointments, doctorId, now],
  );
  const nextId = queue.find((a) => !isLockedStatus(a.status))?.id;
  const count = (s: string) => queue.filter((a) => a.status === s).length;
  const ready = status === 'ready';

  const summary = [
    {
      icon: ClipboardList,
      label: t('myDay.summary.waiting'),
      value: count('pending') + count('confirmed'),
    },
    { icon: UserCheck, label: t('myDay.summary.arrived'), value: count('arrived') },
    { icon: ClipboardCheck, label: t('myDay.summary.done'), value: count('done') },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <PageHeader
        title={t('myDay.title')}
        subtitle={`${doctor ? localize(doctor.name) : ''}${doctor ? ' · ' : ''}${format.date(now)}`}
      />

      {status === 'error' ? (
        <ErrorState
          title={t('myDay.errorTitle')}
          description={t('myDay.errorDescription')}
          onRetry={reload}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {summary.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-muted">{label}</p>
                  {ready ? (
                    <p className="text-2xl font-semibold text-fg">{format.number(value)}</p>
                  ) : (
                    <Skeleton className="mt-1 h-8 w-12" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {!ready ? (
            <div className="flex flex-col gap-3" aria-busy>
              {[0, 1, 2].map((n) => (
                <Skeleton key={n} className="h-28" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong bg-surface">
              <EmptyState
                icon={ClipboardList}
                title={t('myDay.emptyTitle')}
                description={t('myDay.emptyDescription')}
              />
            </div>
          ) : (
            <ol aria-label={t('myDay.queue')} className="flex flex-col gap-3">
              {queue.map((appointment) => (
                <QueueItem
                  key={appointment.id}
                  appointment={appointment}
                  isNext={appointment.id === nextId}
                  now={now}
                />
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
