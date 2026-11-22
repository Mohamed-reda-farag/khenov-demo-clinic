import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from '@/lib/scheduling/constants';

/** `'09:00'`, `'09:30'` ... `'21:00'`: the working hours a doctor can pick. */
export const TIME_OPTIONS: string[] = Array.from(
  { length: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 2 + 1 },
  (_, i) => {
    const minutes = CALENDAR_START_HOUR * 60 + i * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  },
);
