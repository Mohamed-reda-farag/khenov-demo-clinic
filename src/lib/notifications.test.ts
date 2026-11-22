import { describe, expect, it } from 'vitest';
import type { Appointment } from '@/data/types';
import { notificationForChange } from './notifications';

const base: Appointment = {
  id: 'ap-1',
  patientId: 'pt-1',
  doctorId: 'dr-1',
  serviceId: 'sv-1',
  start: new Date(2026, 10, 18, 10, 0).toISOString(),
  durationMin: 30,
  status: 'pending',
  visitNote: null,
  cancelReason: null,
};

describe('notificationForChange', () => {
  it('notifies about a new booking', () => {
    expect(notificationForChange(null, base)).toMatchObject({
      type: 'booked',
      patientId: 'pt-1',
      appointmentId: 'ap-1',
      when: base.start,
    });
  });

  it('notifies about status changes, including cancellations', () => {
    expect(notificationForChange(base, { ...base, status: 'confirmed' })).toMatchObject({
      type: 'status',
      status: 'confirmed',
    });
    expect(notificationForChange(base, { ...base, status: 'cancelled' })).toMatchObject({
      type: 'status',
      status: 'cancelled',
    });
  });

  it('notifies when an appointment moves in time or to another doctor', () => {
    const later = new Date(2026, 10, 18, 11, 0).toISOString();
    expect(notificationForChange(base, { ...base, start: later })?.type).toBe('rescheduled');
    expect(notificationForChange(base, { ...base, doctorId: 'dr-2' })?.type).toBe('rescheduled');
  });

  it('notifies about a deletion', () => {
    expect(notificationForChange(base, null)).toMatchObject({ type: 'deleted', patientId: 'pt-1' });
  });

  it('stays quiet for changes that are not worth a notification', () => {
    expect(notificationForChange(base, { ...base, visitNote: 'تمت المراجعة' })).toBeNull();
    expect(notificationForChange(null, null)).toBeNull();
  });
});
