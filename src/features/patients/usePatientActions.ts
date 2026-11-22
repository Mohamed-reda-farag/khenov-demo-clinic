import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/components/ui/confirm';
import { isRepositoryError } from '@/data/repository/errors';
import type { Patient } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { isUpcoming } from '@/lib/scheduling/rules';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useToastStore } from '@/stores/toastStore';
import { now } from '@/lib/clock';

/** Deleting a patient: blocked with a clear message while upcoming appointments exist. */
export function usePatientActions() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const confirm = useConfirm();

  const remove = useCallback(
    async (patient: Patient): Promise<boolean> => {
      const name = localize(patient.name);
      const items = useAppointmentsStore.getState().items.filter((a) => a.patientId === patient.id);
      const upcoming = items.filter((a) => isUpcoming(a, now())).length;
      const blocked = () =>
        confirm({
          title: t('patients.blockedTitle'),
          description: t('patients.blockedDescription', { name, count: format.number(upcoming) }),
          confirmLabel: t('common.gotIt'),
          infoOnly: true,
        });

      if (upcoming > 0) {
        await blocked();
        return false;
      }
      const accepted = await confirm({
        title: t('patients.deleteTitle'),
        description:
          items.length > 0
            ? t('patients.deleteWithHistory', { name, count: format.number(items.length) })
            : t('patients.deleteDescription', { name }),
        confirmLabel: t('patients.delete'),
        tone: 'danger',
      });
      if (!accepted) return false;

      try {
        const removedIds = await useCatalogStore.getState().removePatient(patient.id);
        useAppointmentsStore.getState().removeMany(removedIds);
        useToastStore
          .getState()
          .push({ tone: 'success', message: t('toast.patientDeleted', { name }) });
        return true;
      } catch (error) {
        if (isRepositoryError(error) && error.code === 'in_use') await blocked();
        else useToastStore.getState().push({ tone: 'error', message: t('toast.failed') });
        return false;
      }
    },
    [t, format, localize, confirm],
  );

  return { remove };
}
