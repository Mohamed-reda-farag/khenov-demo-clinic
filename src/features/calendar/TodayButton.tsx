import { CalendarDays } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { isCurrentPeriod, todayTarget, type ScheduleView } from '@/lib/scheduling/navigation';
import { useNow } from '@/lib/useNow';

interface TodayButtonProps {
  view: ScheduleView;
  /** Any date inside the period being shown. */
  anchor: Date;
  onGoToday: () => void;
}

/**
 * "Today" in day view, "This week" in week view. When the current day / week is already shown it
 * turns subtle and does nothing (aria-disabled keeps it reachable by keyboard and screen readers).
 */
export function TodayButton({ view, anchor, onGoToday }: TodayButtonProps) {
  const { t } = useTranslation();
  const now = useNow();
  const current = isCurrentPeriod(view, anchor, now);

  return (
    <Button
      variant={current ? 'ghost' : 'secondary'}
      aria-disabled={current || undefined}
      onClick={() => {
        if (!current) onGoToday();
      }}
      className={cn(current && 'cursor-default opacity-60 hover:bg-transparent hover:text-muted')}
    >
      <CalendarDays className="size-4" aria-hidden />
      {t(`calendar.${todayTarget(view)}`)}
    </Button>
  );
}
