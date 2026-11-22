import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  History,
  Pencil,
  Trash2,
  UserX,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/features/appointments/StatusBadge';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { isUpcoming } from '@/lib/scheduling/rules';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useUiStore } from '@/stores/uiStore';
import { PatientFormDialog } from './PatientFormDialog';
import { usePatientActions } from './usePatientActions';

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof History;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4 shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="truncate text-lg font-semibold text-fg">{value}</p>
      </div>
    </div>
  );
}

export function PatientProfileScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const navigate = useNavigate();
  const now = useNow();
  const { id } = useParams();
  const status = useDataStatus();
  const reload = useReloadData();
  const { patientById, doctorById, serviceById } = useCatalogMaps();
  const appointments = useAppointmentsStore((state) => state.items);
  const openForm = useUiStore((state) => state.openForm);
  const openDetail = useUiStore((state) => state.openDetail);
  const { remove } = usePatientActions();
  const [editing, setEditing] = useState(false);

  const patient = id ? patientById.get(id) : undefined;
  const history = useMemo(
    () =>
      appointments.filter((a) => a.patientId === id).sort((a, b) => b.start.localeCompare(a.start)),
    [appointments, id],
  );

  if (status === 'error') {
    return (
      <ErrorState
        title={t('patients.errorTitle')}
        description={t('patients.errorDescription')}
        onRetry={reload}
      />
    );
  }
  if (status !== 'ready') {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6" aria-busy>
        <Skeleton className="h-24" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!patient) {
    return (
      <EmptyState
        icon={UserX}
        title={t('patients.notFoundTitle')}
        description={t('patients.notFoundDescription')}
        action={
          <Link to="/patients" className={buttonStyles('secondary')}>
            {t('patients.back')}
          </Link>
        }
      />
    );
  }

  const upcoming = history.filter((a) => isUpcoming(a, now));
  const next = [...upcoming].sort((a, b) => a.start.localeCompare(b.start))[0];
  const name = localize(patient.name);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <Link
        to="/patients"
        className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden />
        {t('patients.back')}
      </Link>

      <header className="anim-rise-in flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary-strong"
          >
            {name.charAt(0)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-fg">{name}</h1>
            <p className="mt-1 text-sm text-muted">
              <span dir="ltr">{patient.phone}</span>
              {' · '}
              {patient.age === null
                ? t('patients.ageUnknown')
                : t('patients.ageYears', { age: format.number(patient.age) })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => openForm({ mode: 'create', patientId: patient.id })}>
            <CalendarPlus className="size-4" aria-hidden />
            {t('patients.book')}
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="size-4" aria-hidden />
            {t('patients.edit')}
          </Button>
          <Button
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => void remove(patient).then((done) => done && navigate('/patients'))}
          >
            <Trash2 className="size-4" aria-hidden />
            {t('patients.delete')}
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          icon={History}
          label={t('patients.profile.visits')}
          value={format.number(history.filter((a) => a.status === 'done').length)}
        />
        <Stat
          icon={CalendarClock}
          label={t('patients.profile.upcoming')}
          value={format.number(upcoming.length)}
        />
        <Stat
          icon={CalendarClock}
          label={t('patients.profile.next')}
          value={
            next
              ? `${format.dayMonth(new Date(next.start))} · ${format.time(next.start)}`
              : t('patients.noNext')
          }
        />
      </div>

      <section
        aria-labelledby="history-title"
        className="rounded-lg border border-line bg-surface shadow-sm"
      >
        <h2 id="history-title" className="border-b border-line p-4 text-lg font-semibold text-fg">
          {t('patients.profile.history')}
        </h2>
        {history.length === 0 ? (
          <EmptyState
            icon={History}
            title={t('patients.profile.historyEmptyTitle')}
            description={t('patients.profile.historyEmptyDescription')}
            action={
              <Button onClick={() => openForm({ mode: 'create', patientId: patient.id })}>
                {t('patients.book')}
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <caption className="sr-only">{t('patients.profile.history')}</caption>
              <thead>
                <tr className="border-b border-line text-xs text-muted">
                  {['date', 'service', 'doctor', 'status'].map((column) => (
                    <th key={column} scope="col" className="px-4 py-3 text-start font-semibold">
                      {t(`patients.profile.columns.${column}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {history.map((appointment) => {
                  const service = serviceById.get(appointment.serviceId);
                  const doctor = doctorById.get(appointment.doctorId);
                  return (
                    <tr key={appointment.id} className="hover:bg-sunken">
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => openDetail(appointment.id)}
                          className="min-h-11 text-start font-semibold text-fg hover:underline"
                        >
                          {format.dayMonth(new Date(appointment.start))} ·{' '}
                          {format.time(appointment.start)}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {service ? localize(service.name) : t('common.deletedService')}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {doctor ? localize(doctor.name) : ''}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={appointment.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <PatientFormDialog open={editing} patient={patient} onOpenChange={setEditing} />
    </div>
  );
}
