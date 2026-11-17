import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from '@/lib/scheduling/constants';

export const PX_PER_HOUR = 96;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const TOTAL_MIN = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
export const GRID_HEIGHT = TOTAL_MIN * PX_PER_MIN;
export const GUTTER_WIDTH = '4.5rem';
export const COLUMN_MIN_WIDTH = '10.5rem';

export interface CalendarColumn {
  key: string;
  /** Accessible name of the column (the day, or the doctor). */
  label: string;
  date: Date;
  /** `null` in the week view when every doctor is shown. */
  doctorId: string | null;
}
