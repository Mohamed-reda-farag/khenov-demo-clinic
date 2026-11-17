import { addDays, eachDayOfInterval, startOfDay, startOfWeek } from 'date-fns';
import { CalendarSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useUiStore } from '@/stores/uiStore';
import { CalendarGrid } from './CalendarGrid';
import { CalendarSkeleton } from './CalendarSkeleton';
import { CalendarToolbar, type CalendarView } from './CalendarToolbar';
import type { CalendarColumn } from './constants';

/** Egypt's week starts on Saturday. */
const WEEK_STARTS_ON = 6;

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function CalendarScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const status = useDataStatus();
  const reload = useReloadData();
  const lookups = useCatalogMaps();
  const doctors = useCatalogStore((state) => state.doctors);
  const appointments = useAppointmentsStore((state) => state.items);
  const openForm = useUiStore((state) => state.openForm);

  const [view, setView] = useState<CalendarView>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [doctorFilter, setDoctorFilter] = useState('all');
  const filterDoctorId = doctorFilter === 'all' ? null : doctorFilter;

  const columns = useMemo<CalendarColumn[]>(() => {
    if (view === 'week') {
      const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
      return eachDayOfInterval({ start, end: addDays(start, 6) }).map((date) => ({
        key: dayKey(date),
        label: format.date(date),
        date,
        doctorId: filterDoctorId,
      }));
    }
    return doctors
      .filter((doctor) => filterDoctorId === null || doctor.id === filterDoctorId)
      .map((doctor) => ({
        key: doctor.id,
        label: localize(doctor.name),
        date: anchor,
        doctorId: doctor.id,
      }));
  }, [view, anchor, doctors, filterDoctorId, format, localize]);

  const visibleCount = useMemo(() => {
    const days = new Set(columns.map((column) => dayKey(column.date)));
    return appointments.filter(
      (a) =>
        days.has(dayKey(new Date(a.start))) &&
        (filterDoctorId === null || a.doctorId === filterDoctorId),
    ).length;
  }, [columns, appointments, filterDoctorId]);

  if (status === 'error') {
    return (
      <ErrorState
        title={t('calendar.errorTitle')}
        description={t('calendar.errorDescription')}
        onRetry={reload}
      />
    );
  }
  if (status !== 'ready') return <CalendarSkeleton />;

  const step = view === 'week' ? 7 : 1;
  const first = columns[0]?.date ?? anchor;
  const last = columns.at(-1)?.date ?? anchor;
  const label = view === 'week' ? format.range(first, last) : format.date(anchor);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <CalendarToolbar
        label={label}
        view={view}
        doctors={doctors}
        doctorFilter={doctorFilter}
        onViewChange={setView}
        onDoctorChange={setDoctorFilter}
        onPrev={() => setAnchor((current) => addDays(current, -step))}
        onNext={() => setAnchor((current) => addDays(current, step))}
        onToday={() => setAnchor(startOfDay(new Date()))}
        onNewAppointment={() =>
          openForm({ mode: 'create', start: undefined, doctorId: filterDoctorId })
        }
      />
      {visibleCount === 0 && (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface">
          <EmptyState
            icon={CalendarSearch}
            title={t('calendar.emptyTitle')}
            description={t('calendar.emptyDescription')}
          />
        </div>
      )}
      <CalendarGrid
        columns={columns}
        appointments={appointments}
        lookups={lookups}
        filterDoctorId={filterDoctorId}
        view={view}
      />
    </div>
  );
}
