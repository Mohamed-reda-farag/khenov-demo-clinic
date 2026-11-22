import { addDays, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useFormat } from '@/i18n/useFormat';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { CalendarGrid } from './CalendarGrid';
import { weekColumns } from './columns';
import { TodayButton } from './TodayButton';
import { now } from '@/lib/clock';

/** One doctor's week, read-only (no booking by click, no dragging). */
export function WeekSchedule({ doctorId }: { doctorId: string }) {
  const { t } = useTranslation();
  const format = useFormat();
  const lookups = useCatalogMaps();
  const appointments = useAppointmentsStore((state) => state.items);
  const [anchor, setAnchor] = useState(() => startOfDay(now()));
  const columns = useMemo(
    () => weekColumns(anchor, doctorId, format.date),
    [anchor, doctorId, format],
  );
  const first = columns[0]?.date ?? anchor;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip label={t('calendar.prevWeek')}>
          <IconButton
            aria-label={t('calendar.prevWeek')}
            onClick={() => setAnchor((d) => addDays(d, -7))}
          >
            <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
          </IconButton>
        </Tooltip>
        <Tooltip label={t('calendar.nextWeek')}>
          <IconButton
            aria-label={t('calendar.nextWeek')}
            onClick={() => setAnchor((d) => addDays(d, 7))}
          >
            <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
          </IconButton>
        </Tooltip>
        <TodayButton view="week" anchor={anchor} onGoToday={() => setAnchor(startOfDay(now()))} />
        <h2 className="ms-2 text-lg font-semibold text-fg" aria-live="polite">
          {format.range(first, addDays(first, 6))}
        </h2>
      </div>
      <CalendarGrid
        columns={columns}
        appointments={appointments}
        lookups={lookups}

        view="week"
        readOnly
      />
    </div>
  );
}
