import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import type { Conflict } from '@/lib/scheduling/conflicts';
import { now } from '@/lib/clock';
import { earliestBookable } from '@/lib/scheduling/past';
import { atTime, endOf } from '@/lib/scheduling/time';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogMaps } from './useCatalogMaps';

export interface ConflictContext {
  doctorId: string;
  patientId: string | null;
  /** Day the candidate falls on (used for the working-hours message). */
  day: Date;
}

/** Turns a Conflict into a clear sentence (with the other appointment's time when relevant). */
export function useConflictText() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const { doctorById, patientById } = useCatalogMaps();

  return useCallback(
    (conflict: Conflict, context: ConflictContext): string => {
      const doctor = doctorById.get(context.doctorId);
      const doctorName = doctor ? localize(doctor.name) : '';

      if (conflict.code === 'past_time') {
        const current = now();
        return context.day.toDateString() === current.toDateString()
          ? t('form.conflict.past_time', { earliest: format.time(earliestBookable(current)) })
          : t('form.conflict.past_day');
      }

      if (conflict.code === 'outside_hours') {
        return t('form.conflict.outside_hours', {
          doctor: doctorName,
          from: doctor ? format.time(atTime(context.day, doctor.workStart)) : '',
          to: doctor ? format.time(atTime(context.day, doctor.workEnd)) : '',
        });
      }

      const other = useAppointmentsStore
        .getState()
        .items.find((item) => item.id === conflict.appointmentId);
      const from = other ? format.time(other.start) : '';
      const to = other ? format.time(endOf(new Date(other.start), other.durationMin)) : '';
      const patient = context.patientId ? patientById.get(context.patientId) : undefined;

      return conflict.code === 'doctor_overlap'
        ? t('form.conflict.doctor_overlap', { doctor: doctorName, from, to })
        : t('form.conflict.patient_overlap', {
            patient: patient ? localize(patient.name) : '',
            from,
            to,
          });
    },
    [t, format, localize, doctorById, patientById],
  );
}
