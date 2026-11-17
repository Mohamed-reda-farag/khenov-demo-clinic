import type { AppointmentStatus, Doctor } from '@/data/types';

/** Full class names on purpose: Tailwind only generates classes it can see in the source. */
export const STATUS_STYLES: Record<
  AppointmentStatus,
  { block: string; badge: string; dot: string; step: string }
> = {
  pending: {
    block: 'border-status-pending bg-status-pending-soft',
    badge: 'bg-status-pending-soft text-status-pending',
    dot: 'bg-status-pending',
    step: 'border-status-pending bg-status-pending text-status-pending-soft',
  },
  confirmed: {
    block: 'border-status-confirmed bg-status-confirmed-soft',
    badge: 'bg-status-confirmed-soft text-status-confirmed',
    dot: 'bg-status-confirmed',
    step: 'border-status-confirmed bg-status-confirmed text-status-confirmed-soft',
  },
  arrived: {
    block: 'border-status-arrived bg-status-arrived-soft',
    badge: 'bg-status-arrived-soft text-status-arrived',
    dot: 'bg-status-arrived',
    step: 'border-status-arrived bg-status-arrived text-status-arrived-soft',
  },
  done: {
    block: 'border-status-done bg-status-done-soft',
    badge: 'bg-status-done-soft text-status-done',
    dot: 'bg-status-done',
    step: 'border-status-done bg-status-done text-status-done-soft',
  },
  cancelled: {
    block: 'border-status-cancelled bg-status-cancelled-soft',
    badge: 'bg-status-cancelled-soft text-status-cancelled',
    dot: 'bg-status-cancelled',
    step: 'border-status-cancelled bg-status-cancelled text-status-cancelled-soft',
  },
};

export const DOCTOR_DOT: Record<Doctor['colorToken'], string> = {
  'doctor-1': 'bg-doctor-1',
  'doctor-2': 'bg-doctor-2',
  'doctor-3': 'bg-doctor-3',
  'doctor-4': 'bg-doctor-4',
};
