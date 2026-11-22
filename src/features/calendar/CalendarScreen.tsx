import { addDays } from 'date-fns';
import { CalendarSearch } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { visibleDoctors, type SpecialtyFilter } from '@/lib/scheduling/filters';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useUiStore } from '@/stores/uiStore';
import { CalendarGrid } from './CalendarGrid';
import { CalendarSkeleton } from './CalendarSkeleton';
import { CalendarToolbar } from './CalendarToolbar';
import { dayKey, weekColumns } from './columns';
import type { CalendarColumn } from './constants';

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
  const {
    anchor,
    view,
    specialtyFilter,
    doctorFilter,
    setView,
    setSpecialtyFilter,
    setDoctorFilter,
    goToday,
    shift,
  } = useCalendarStore();

  // Doctors of the chosen specialty (the doctor options) and the ones actually shown.
  const specialtyDoctors = useMemo(
    () => visibleDoctors(doctors, specialtyFilter, 'all'),
    [doctors, specialtyFilter],
  );
  const shownDoctors = useMemo(
    () => visibleDoctors(doctors, specialtyFilter, doctorFilter),
    [doctors, specialtyFilter, doctorFilter],
  );
  const shownIds = useMemo(() => shownDoctors.map((d) => d.id), [shownDoctors]);
  const singleDoctorId = shownDoctors.length === 1 ? shownDoctors[0]!.id : null;
  // Only a deliberate doctor choice pre-fills the booking form.
  const filterDoctorId = doctorFilter === 'all' ? null : singleDoctorId;
  const narrowed = specialtyFilter !== 'all' || doctorFilter !== 'all';

  const columns = useMemo<CalendarColumn[]>(() => {
    if (view === 'week') {
      return weekColumns(anchor, singleDoctorId, format.date, narrowed ? shownIds : null);
    }
    return shownDoctors.map((doctor) => ({
      key: doctor.id,
      label: localize(doctor.name),
      date: anchor,
      doctorId: doctor.id,
    }));
  }, [view, anchor, shownDoctors, shownIds, singleDoctorId, narrowed, format, localize]);

  const visibleCount = useMemo(() => {
    const days = new Set(columns.map((column) => dayKey(column.date)));
    return appointments.filter(
      (a) => days.has(dayKey(new Date(a.start))) && shownIds.includes(a.doctorId),
    ).length;
  }, [columns, appointments, shownIds]);

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

  const first = columns[0]?.date ?? anchor;
  const last = view === 'week' ? addDays(first, 6) : anchor;
  const label = view === 'week' ? format.range(first, last) : format.date(anchor);

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <CalendarToolbar
        label={label}
        view={view}
        anchor={anchor}
        doctors={specialtyDoctors}
        specialtyFilter={specialtyFilter}
        doctorFilter={doctorFilter}
        onViewChange={setView}
        onSpecialtyChange={(specialty: SpecialtyFilter) => setSpecialtyFilter(specialty, doctors)}
        onDoctorChange={setDoctorFilter}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={goToday}
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
      <CalendarGrid columns={columns} appointments={appointments} lookups={lookups} view={view} />
    </div>
  );
}
