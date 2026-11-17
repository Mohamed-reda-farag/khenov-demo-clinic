import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { repositories } from '@/data/repository';
import type { RepositoryError } from '@/data/repository/errors';
import type { Appointment, AppointmentStatus } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { createId } from '@/lib/id';
import type { Conflict } from '@/lib/scheduling/conflicts';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useToastStore } from '@/stores/toastStore';
import { useCatalogMaps } from './useCatalogMaps';
import { useConflictText } from './useConflictText';

export interface BookInput {
  patientId: string;
  doctorId: string;
  serviceId: string;
  start: Date;
}

/**
 * Every appointment change goes through here: optimistic update, repository call, then a toast
 * with Undo. Undo restores the previous snapshot (or removes a freshly booked appointment).
 */
export function useAppointmentActions() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const conflictText = useConflictText();
  const { patientById, serviceById } = useCatalogMaps();

  return useMemo(() => {
    const { commit } = useAppointmentsStore.getState();
    const push = useToastStore.getState().push;

    const patientName = (id: string) => {
      const patient = patientById.get(id);
      return patient ? localize(patient.name) : '';
    };
    const when = (start: Date | string) =>
      `${format.dayMonth(new Date(start))} ${format.time(start)}`;

    const describeConflict = (conflict: Conflict, subject: Appointment) =>
      t('toast.conflict', {
        reason: conflictText(conflict, {
          doctorId: subject.doctorId,
          patientId: subject.patientId,
          day: new Date(subject.start),
        }),
      });

    const fail = (error: RepositoryError | null, subject: Appointment | null) => {
      let message = t('toast.failed');
      if (error?.code === 'not_found') message = t('toast.notFound');
      const conflict = error?.conflicts[0];
      if (conflict && subject) message = describeConflict(conflict, subject);
      push({ tone: 'error', message });
    };

    const undo = async (before: Appointment | null, after: Appointment | null) => {
      const result = await commit(after, before, () =>
        before
          ? repositories.appointments.restore(before)
          : repositories.appointments.remove(after!.id),
      );
      if (result.ok) push({ tone: 'info', message: t('toast.undone') });
      else fail(result.error, before ?? after);
    };

    const perform = async (
      before: Appointment | null,
      after: Appointment | null,
      run: () => Promise<Appointment>,
      message: string,
    ): Promise<boolean> => {
      const result = await commit(before, after, run);
      if (!result.ok) {
        fail(result.error, after ?? before);
        return false;
      }
      push({
        tone: 'success',
        message,
        actionLabel: t('toast.undo'),
        onAction: () => void undo(before, after),
      });
      return true;
    };

    return {
      book: (input: BookInput) => {
        const service = serviceById.get(input.serviceId);
        if (!service) return Promise.resolve(false);
        const after: Appointment = {
          id: createId('ap'),
          patientId: input.patientId,
          doctorId: input.doctorId,
          serviceId: input.serviceId,
          start: input.start.toISOString(),
          durationMin: service.durationMin,
          status: 'pending',
          visitNote: null,
          cancelReason: null,
        };
        return perform(
          null,
          after,
          () =>
            repositories.appointments.create({
              id: after.id,
              patientId: after.patientId,
              doctorId: after.doctorId,
              serviceId: after.serviceId,
              start: after.start,
            }),
          t('toast.booked', { patient: patientName(after.patientId), when: when(after.start) }),
        );
      },

      changeStatus: (appointment: Appointment, to: AppointmentStatus, reason?: string) => {
        const cancelReason = to === 'cancelled' ? reason?.trim() || null : appointment.cancelReason;
        return perform(
          appointment,
          { ...appointment, status: to, cancelReason },
          () => repositories.appointments.update(appointment.id, { status: to, cancelReason }),
          t(`toast.status.${to}`, { patient: patientName(appointment.patientId) }),
        );
      },

      /** Edit form and drag-and-drop both land here. */
      edit: (appointment: Appointment, changes: Partial<BookInput>) => {
        const next = {
          patientId: changes.patientId ?? appointment.patientId,
          doctorId: changes.doctorId ?? appointment.doctorId,
          serviceId: changes.serviceId ?? appointment.serviceId,
          start: changes.start ? changes.start.toISOString() : appointment.start,
        };
        const service = serviceById.get(next.serviceId);
        const moved = next.start !== appointment.start || next.doctorId !== appointment.doctorId;
        const patient = patientName(next.patientId);
        return perform(
          appointment,
          { ...appointment, ...next, durationMin: service?.durationMin ?? appointment.durationMin },
          () => repositories.appointments.update(appointment.id, next),
          moved
            ? t('toast.rescheduled', { patient, when: when(next.start) })
            : t('toast.updated', { patient }),
        );
      },

      remove: (appointment: Appointment) =>
        perform(
          appointment,
          null,
          () => repositories.appointments.remove(appointment.id),
          t('toast.deleted', { patient: patientName(appointment.patientId) }),
        ),

      /** Tells the user why a drop was refused (no change is made). */
      reportBlocked: (
        conflict: Conflict,
        subject: Appointment,
        target: { doctorId: string; day: Date },
      ) =>
        push({
          tone: 'error',
          message: t('calendar.blocked', {
            reason: conflictText(conflict, {
              doctorId: target.doctorId,
              patientId: subject.patientId,
              day: target.day,
            }),
          }),
        }),
    };
  }, [t, format, localize, conflictText, patientById, serviceById]);
}
