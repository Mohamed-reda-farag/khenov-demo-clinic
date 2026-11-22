import { describe, expect, it } from 'vitest';
import { isCurrentPeriod, todayTarget } from './navigation';

// Saturday 21 Nov 2026 is the first day of the week (Saturday to Friday).
const now = new Date(2026, 10, 25, 14, 0); // Wednesday

describe('today / this week button', () => {
  it('says Today in day view and This week in week view', () => {
    expect(todayTarget('day')).toBe('today');
    expect(todayTarget('week')).toBe('thisWeek');
  });

  it('day view is current only on the same day', () => {
    expect(isCurrentPeriod('day', new Date(2026, 10, 25, 0, 0), now)).toBe(true);
    expect(isCurrentPeriod('day', new Date(2026, 10, 26), now)).toBe(false);
    expect(isCurrentPeriod('day', new Date(2026, 10, 24), now)).toBe(false);
  });

  it('week view is current for any day of the Saturday-to-Friday week', () => {
    expect(isCurrentPeriod('week', new Date(2026, 10, 21), now)).toBe(true); // Saturday
    expect(isCurrentPeriod('week', new Date(2026, 10, 27), now)).toBe(true); // Friday
    expect(isCurrentPeriod('week', new Date(2026, 10, 20), now)).toBe(false); // previous Friday
    expect(isCurrentPeriod('week', new Date(2026, 10, 28), now)).toBe(false); // next Saturday
  });
});
