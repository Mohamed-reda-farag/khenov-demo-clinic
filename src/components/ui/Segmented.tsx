import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  lang?: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 rounded-md bg-sunken p-1">
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon, lang }) => {
        const selected = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              'press inline-flex min-h-11 items-center gap-2 rounded-sm px-4 text-sm font-medium',
              selected ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            <span lang={lang}>{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
