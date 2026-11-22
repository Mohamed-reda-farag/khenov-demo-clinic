import { isSameDay, isSameWeek } from 'date-fns';

export type ScheduleView = 'day' | 'week';

/** Egypt's week starts on Saturday. */
const WEEK_STARTS_ON = 6;

/** Day view jumps to today, week view to the current week. */
export type TodayTarget = 'today' | 'thisWeek';

export function todayTarget(view: ScheduleView): TodayTarget {
  return view === 'week' ? 'thisWeek' : 'today';
}

/** True when the shown day (day view) or week (week view) already contains `now`. */
export function isCurrentPeriod(view: ScheduleView, anchor: Date, now: Date): boolean {
  return view === 'week'
    ? isSameWeek(anchor, now, { weekStartsOn: WEEK_STARTS_ON })
    : isSameDay(anchor, now);
}
