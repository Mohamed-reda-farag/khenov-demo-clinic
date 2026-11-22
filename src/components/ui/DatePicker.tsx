import * as Popover from '@radix-ui/react-popover';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/i18n/useFormat';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';
import { now } from '@/lib/clock';

/** Egypt's week starts on Saturday. */
const WEEK_STARTS_ON = 6;

interface DatePickerProps {
  id: string;
  value: Date;
  onChange: (date: Date) => void;
  /** Earlier days are shown but cannot be picked. */
  minDate?: Date;
}

function Calendar({
  value,
  minDate,
  onPick,
}: {
  value: Date;
  minDate?: Date;
  onPick: (date: Date) => void;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const [cursor, setCursor] = useState(() => startOfDay(value));
  const gridRef = useRef<HTMLDivElement>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: WEEK_STARTS_ON }),
  });
  const weeks = Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
  const today = startOfDay(now());

  const moveTo = (next: Date) => {
    setCursor(next);
    // Focus the new day once it has rendered (it may be in another month).
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>('[data-cursor="true"]')?.focus();
    });
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const rtl = document.documentElement.dir === 'rtl';
    const sideways = rtl ? -1 : 1;
    const steps: Record<string, Date> = {
      ArrowRight: addDays(cursor, sideways),
      ArrowLeft: addDays(cursor, -sideways),
      ArrowDown: addDays(cursor, 7),
      ArrowUp: addDays(cursor, -7),
      PageDown: addMonths(cursor, 1),
      PageUp: addMonths(cursor, -1),
      Home: startOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
      End: endOfWeek(cursor, { weekStartsOn: WEEK_STARTS_ON }),
    };
    const next = steps[event.key];
    if (!next) return;
    event.preventDefault();
    moveTo(startOfDay(next));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <IconButton
          aria-label={t('datePicker.prevMonth')}
          onClick={() => moveTo(addMonths(cursor, -1))}
        >
          <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
        </IconButton>
        <p className="text-base font-semibold text-fg" aria-live="polite">
          {format.monthYear(cursor)}
        </p>
        <IconButton
          aria-label={t('datePicker.nextMonth')}
          onClick={() => moveTo(addMonths(cursor, 1))}
        >
          <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
        </IconButton>
      </div>

      <div ref={gridRef} role="grid" aria-label={t('datePicker.label')} onKeyDown={onKeyDown}>
        <div role="row" className="grid grid-cols-7">
          {weeks[0]?.map((day) => (
            <span
              key={day.getDay()}
              role="columnheader"
              className="py-1 text-center text-xs text-muted"
            >
              {format.weekday(day)}
            </span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]?.getTime()} role="row" className="grid grid-cols-7">
            {week.map((day) => {
              const selected = isSameDay(day, value);
              const isCursor = isSameDay(day, cursor);
              const disabled = minDate !== undefined && day < startOfDay(minDate);
              return (
                <span
                  key={day.getTime()}
                  role="gridcell"
                  aria-selected={selected}
                  className="flex justify-center"
                >
                  <button
                    type="button"
                    tabIndex={isCursor ? 0 : -1}
                    data-cursor={isCursor}
                    aria-label={format.date(day)}
                    aria-current={isSameDay(day, today) ? 'date' : undefined}
                    aria-disabled={disabled || undefined}
                    onClick={() => !disabled && onPick(day)}
                    className={cn(
                      'press size-11 rounded-md text-sm',
                      disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                      selected
                        ? 'bg-primary font-semibold text-on-primary'
                        : isSameMonth(day, cursor)
                          ? 'text-fg hover:bg-sunken'
                          : 'text-subtle hover:bg-sunken',
                      !selected && isSameDay(day, today) && 'border border-primary font-semibold',
                    )}
                  >
                    {format.dayNumber(day)}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPick(today)}
        className="press min-h-11 self-start rounded-md px-3 text-sm font-semibold text-primary-strong hover:bg-primary-soft"
      >
        {t('datePicker.today')}
      </button>
    </div>
  );
}

/** Localized date picker (Radix Popover): month/day names, digits, Saturday-first week, RTL-aware keys. */
export function DatePicker({ id, value, onChange, minDate }: DatePickerProps) {
  const format = useFormat();
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          className="press flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-line-strong bg-surface px-3 text-start text-sm text-fg"
        >
          <span className="truncate">{format.date(value)}</span>
          <CalendarDays className="size-4 shrink-0 text-subtle" aria-hidden />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="panel z-[60] w-[22rem] max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-4 shadow-lg"
        >
          {/* Mounted only while open, so it always starts on the selected day. */}
          <Calendar
            value={value}
            minDate={minDate}
            onPick={(date) => {
              onChange(date);
              setOpen(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
