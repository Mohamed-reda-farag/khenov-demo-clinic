import { CalendarDays, ChevronLeft, ChevronRight, Info, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { Segmented } from '@/components/ui/Segmented';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Doctor } from '@/data/types';
import { useLocalized } from '@/i18n/useLocalized';

export type CalendarView = 'week' | 'day';

interface CalendarToolbarProps {
  label: string;
  view: CalendarView;
  doctors: Doctor[];
  doctorFilter: string;
  onViewChange: (view: CalendarView) => void;
  onDoctorChange: (doctorId: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onNewAppointment: () => void;
}

export function CalendarToolbar({
  label,
  view,
  doctors,
  doctorFilter,
  onViewChange,
  onDoctorChange,
  onPrev,
  onNext,
  onToday,
  onNewAppointment,
}: CalendarToolbarProps) {
  const { t } = useTranslation();
  const localize = useLocalized();
  const prevLabel = view === 'week' ? t('calendar.prevWeek') : t('calendar.prevDay');
  const nextLabel = view === 'week' ? t('calendar.nextWeek') : t('calendar.nextDay');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tooltip label={prevLabel}>
            <IconButton aria-label={prevLabel} onClick={onPrev}>
              <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
          <Tooltip label={nextLabel}>
            <IconButton aria-label={nextLabel} onClick={onNext}>
              <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
            </IconButton>
          </Tooltip>
          <Button variant="secondary" onClick={onToday}>
            <CalendarDays className="size-4" aria-hidden />
            {t('calendar.today')}
          </Button>
          <h1 className="ms-2 text-xl font-semibold text-fg" aria-live="polite">
            {label}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted">
            <span className="sr-only sm:not-sr-only">{t('calendar.doctorFilter')}</span>
            <Select
              value={doctorFilter}
              onChange={(event) => onDoctorChange(event.target.value)}
              className="min-w-48"
            >
              <option value="all">{t('calendar.allDoctors')}</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {localize(doctor.name)}
                </option>
              ))}
            </Select>
          </label>
          <Segmented
            label={t('calendar.view')}
            value={view}
            onChange={onViewChange}
            options={[
              { value: 'day', label: t('calendar.viewDay') },
              { value: 'week', label: t('calendar.viewWeek') },
            ]}
          />
          <Button onClick={onNewAppointment}>
            <Plus className="size-4" aria-hidden />
            {t('calendar.newAppointment')}
          </Button>
        </div>
      </div>
      <p className="flex items-center gap-2 text-xs text-muted">
        <Info className="size-4 shrink-0" aria-hidden />
        {t('calendar.moveHint')}
      </p>
    </div>
  );
}
