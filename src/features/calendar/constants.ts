import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from '@/lib/scheduling/constants';

export const PX_PER_HOUR = 96;
export const PX_PER_MIN = PX_PER_HOUR / 60;
export const TOTAL_MIN = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;
export const GRID_HEIGHT = TOTAL_MIN * PX_PER_MIN;
export const GUTTER_WIDTH = '4.5rem';
export const GUTTER_PX = 72;
/** Height of the sticky column header (px). */
export const HEADER_HEIGHT = 64;
export const COLUMN_MIN_WIDTH = '10.5rem';

export interface CalendarColumn {
  key: string;
  /** Accessible name of the column (the day, or the doctor). */
  label: string;
  date: Date;
  /** `null` in the week view when several doctors share the column. */
  doctorId: string | null;
  /** Week view only: the doctors whose appointments appear (`null` = every doctor). */
  doctorIds?: readonly string[] | null;
}
