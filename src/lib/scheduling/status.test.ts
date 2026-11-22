import { describe, expect, it } from 'vitest';
import type { Appointment } from '@/data/types';
import {
  canMarkNoShow,
  canTransition,
  canTransitionAt,
  forwardStatus,
  hasEnded,
  isLockedStatus,
  nextStatuses,
} from './status';

// 10:00 start, 30 minutes: ends at 10:30.
const at = (hours: number, minutes: number, seconds = 0, ms = 0) =>
  new Date(2026, 10, 21, hours, minutes, seconds, ms);
const appointment = (status: Appointment['status']) => ({
  start: at(10, 0).toISOString(),
  durationMin: 30,
  status,
});

describe('status flow', () => {
  it('offers only valid transitions', () => {
    expect(nextStatuses('pending')).toEqual(['confirmed', 'cancelled', 'no_show']);
    expect(nextStatuses('confirmed')).toEqual(['arrived', 'cancelled', 'no_show']);
    expect(nextStatuses('arrived')).toEqual(['done', 'cancelled']);
    expect(nextStatuses('done')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
    expect(nextStatuses('no_show')).toEqual([]);
  });

  it('rejects skipping steps and going backwards', () => {
    expect(canTransition('pending', 'arrived')).toBe(false);
    expect(canTransition('pending', 'done')).toBe(false);
    expect(canTransition('arrived', 'confirmed')).toBe(false);
    expect(canTransition('done', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
    expect(canTransition('arrived', 'no_show')).toBe(false);
    expect(canTransition('done', 'no_show')).toBe(false);
    expect(canTransition('no_show', 'pending')).toBe(false);
  });

  it('knows the forward step (never cancelled or no-show)', () => {
    expect(forwardStatus('pending')).toBe('confirmed');
    expect(forwardStatus('confirmed')).toBe('arrived');
    expect(forwardStatus('arrived')).toBe('done');
    expect(forwardStatus('done')).toBeNull();
    expect(forwardStatus('cancelled')).toBeNull();
    expect(forwardStatus('no_show')).toBeNull();
  });

  it('locks exactly Done, Cancelled and No-show', () => {
    expect(['pending', 'confirmed', 'arrived'].map((s) => isLockedStatus(s as never))).toEqual([
      false,
      false,
      false,
    ]);
    expect(['done', 'cancelled', 'no_show'].map((s) => isLockedStatus(s as never))).toEqual([
      true,
      true,
      true,
    ]);
  });
});

describe('no-show timing (injected clock)', () => {
  it('is not allowed before the end time', () => {
    expect(canMarkNoShow(appointment('confirmed'), at(9, 0))).toBe(false);
    expect(canMarkNoShow(appointment('pending'), at(10, 0))).toBe(false);
    expect(canMarkNoShow(appointment('confirmed'), at(10, 29, 59, 999))).toBe(false);
  });

  it('is allowed from the exact end time on', () => {
    expect(hasEnded(appointment('pending'), at(10, 30))).toBe(true);
    expect(canMarkNoShow(appointment('confirmed'), at(10, 30))).toBe(true);
    expect(canMarkNoShow(appointment('pending'), at(10, 30, 0, 1))).toBe(true);
    expect(canMarkNoShow(appointment('pending'), at(18, 0))).toBe(true);
  });

  it('is never allowed from Arrived, Done, Cancelled or No-show', () => {
    for (const status of ['arrived', 'done', 'cancelled', 'no_show'] as const) {
      expect(canMarkNoShow(appointment(status), at(23, 0))).toBe(false);
    }
  });

  it('applies the clock only to No-show, not to the other transitions', () => {
    expect(canTransitionAt(appointment('pending'), 'confirmed', at(9, 0))).toBe(true);
    expect(canTransitionAt(appointment('confirmed'), 'arrived', at(9, 0))).toBe(true);
    expect(canTransitionAt(appointment('confirmed'), 'no_show', at(10, 15))).toBe(false);
    expect(canTransitionAt(appointment('confirmed'), 'no_show', at(10, 30))).toBe(true);
  });
});
