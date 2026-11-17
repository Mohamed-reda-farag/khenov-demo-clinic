import { describe, expect, it } from 'vitest';
import { canTransition, forwardStatus, nextStatuses } from './status';

describe('status flow', () => {
  it('offers only valid transitions', () => {
    expect(nextStatuses('pending')).toEqual(['confirmed', 'cancelled']);
    expect(nextStatuses('confirmed')).toEqual(['arrived', 'cancelled']);
    expect(nextStatuses('arrived')).toEqual(['done', 'cancelled']);
    expect(nextStatuses('done')).toEqual([]);
    expect(nextStatuses('cancelled')).toEqual([]);
  });

  it('rejects skipping steps and going backwards', () => {
    expect(canTransition('pending', 'arrived')).toBe(false);
    expect(canTransition('pending', 'done')).toBe(false);
    expect(canTransition('arrived', 'confirmed')).toBe(false);
    expect(canTransition('done', 'cancelled')).toBe(false);
    expect(canTransition('cancelled', 'pending')).toBe(false);
  });

  it('knows the forward step', () => {
    expect(forwardStatus('pending')).toBe('confirmed');
    expect(forwardStatus('arrived')).toBe('done');
    expect(forwardStatus('done')).toBeNull();
    expect(forwardStatus('cancelled')).toBeNull();
  });
});
