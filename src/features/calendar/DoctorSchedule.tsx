import { addDays, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { Segmented } from '@/components/ui/Segmented';
import { Tooltip } from '@/components/ui/Tooltip';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { now } from '@/lib/clock';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { CalendarGrid } from './CalendarGrid';
import { weekColumns } from './columns';
import type { CalendarColumn } from './constants';
import { TodayButton } from './TodayButton';

type View = 'day' | 'week';

/**
 * One doctor's schedule, Week (default) or Day. No dragging and no booking by click; clicking an
 * appointment opens the same actions as "My day".
 */
export function DoctorSchedule({ doctorId }: { doctorId: string }) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const lookups = useCatalogMaps();
  const appointments = useAppointmentsStore((state) => state.items);
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(now()));
  const step = view === 'week' ? 7 : 1;
  const prevLabel = view === 'week' ? t('calendar.prevWeek') : t('calendar.prevDay');
  const nextLabel = view === 'week' ? t('calendar.nextWeek') : t('calendar.nextDay');

  const columns = useMemo<CalendarColumn[]>(() => {
    if (view === 'week') return weekColumns(anchor, doctorId, format.date);
    const doctor = lookups.doctorById.get(doctorId);
    return [
      {
        key: doctorId,
        label: doctor ? localize(doctor.name) : '',
        date: anchor,
        doctorId,
      },
    ];
  }, [view, anchor, doctorId, format, lookups.doctorById, localize]);

  const first = columns[0]?.date ?? anchor;
  const label = view === 'week' ? format.range(first, addDays(first, 6)) : format.date(anchor);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Tooltip label={prevLabel}>
            <IconButton aria-label={prevLabel} onClick={() => setAnchor((d) => addDays(d, -step))}>
              <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
          <Tooltip label={nextLabel}>
            <IconButton aria-label={nextLabel} onClick={() => setAnchor((d) => addDays(d, step))}>
              <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
          <TodayButton view={view} anchor={anchor} onGoToday={() => setAnchor(startOfDay(now()))} />
          <h2 className="ms-2 text-lg font-semibold text-fg" aria-live="polite">
            {label}
          </h2>
        </div>
        <Segmented
          label={t('calendar.view')}
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: t('calendar.viewDay') },
            { value: 'week', label: t('calendar.viewWeek') },
          ]}
        />
      </div>
      <CalendarGrid
        columns={columns}
        appointments={appointments}
        lookups={lookups}
        view={view}
        readOnly
      />
    </div>
  );
}
