import { useRef, type KeyboardEvent } from 'react';
import { useFormat } from '@/i18n/useFormat';
import { cn } from '@/lib/cn';

const COLUMNS = 4;

interface SlotPickerProps {
  slots: Date[];
  value: Date | null;
  onChange: (start: Date) => void;
  label: string;
}

/** Free time slots as a radio group with one tab stop and arrow-key navigation. */
export function SlotPicker({ slots, value, onChange, label }: SlotPickerProps) {
  const format = useFormat();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = value ? slots.findIndex((slot) => slot.getTime() === value.getTime()) : -1;
  const tabStop = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = document.documentElement.dir === 'rtl';
    const horizontal = rtl ? -1 : 1;
    const moves: Record<string, number> = {
      ArrowRight: horizontal,
      ArrowLeft: -horizontal,
      ArrowDown: COLUMNS,
      ArrowUp: -COLUMNS,
    };
    const current = refs.current.findIndex((el) => el === document.activeElement);
    const step = moves[event.key];
    if (step === undefined || current === -1) return;
    event.preventDefault();
    refs.current[Math.min(slots.length - 1, Math.max(0, current + step))]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto p-1"
    >
      {slots.map((slot, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={slot.getTime()}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onChange(slot)}
            className={cn(
              'press min-h-11 rounded-md border px-1 text-xs font-medium',
              selected
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line-strong bg-surface text-fg hover:bg-sunken',
            )}
          >
            {format.time(slot)}
          </button>
        );
      })}
    </div>
  );
}
