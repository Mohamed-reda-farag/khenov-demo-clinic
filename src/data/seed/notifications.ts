import { subMinutes } from 'date-fns';
import type { AppNotification, Appointment } from '@/data/types';

/** A few seeded notifications (newest first). The rest are generated from the user's own actions. */
export function buildNotifications(now: Date, appointments: Appointment[]): AppNotification[] {
  const isToday = (a: Appointment) => new Date(a.start).toDateString() === now.toDateString();
  const pendingToday = appointments.filter((a) => isToday(a) && a.status === 'pending');
  const online = appointments.find((a) => a.status === 'pending' && new Date(a.start) > now);
  const cancelled = appointments.find((a) => a.status === 'cancelled');

  const base = {
    read: false,
    patientId: null,
    appointmentId: null,
    status: null,
    when: null,
    count: null,
  };
  const items: AppNotification[] = [
    {
      ...base,
      id: 'nt-1',
      type: 'pendingReminder',
      createdAt: subMinutes(now, 12).toISOString(),
      count: pendingToday.length,
    },
  ];
  if (online) {
    items.push({
      ...base,
      id: 'nt-2',
      type: 'onlineBooking',
      createdAt: subMinutes(now, 55).toISOString(),
      patientId: online.patientId,
      appointmentId: online.id,
      when: online.start,
    });
  }
  if (cancelled) {
    items.push({
      ...base,
      id: 'nt-3',
      type: 'status',
      status: 'cancelled',
      createdAt: subMinutes(now, 190).toISOString(),
      patientId: cancelled.patientId,
      appointmentId: cancelled.id,
      when: cancelled.start,
    });
  }
  items.push({
    ...base,
    id: 'nt-4',
    type: 'welcome',
    read: true,
    createdAt: subMinutes(now, 60 * 26).toISOString(),
  });
  return items;
}
