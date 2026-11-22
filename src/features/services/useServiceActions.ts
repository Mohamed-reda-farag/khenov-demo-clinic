import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/components/ui/confirm';
import { isRepositoryError } from '@/data/repository/errors';
import type { Service } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { isUpcoming } from '@/lib/scheduling/rules';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useToastStore } from '@/stores/toastStore';
import { now } from '@/lib/clock';

/** Deleting a service: blocked with a clear message while upcoming appointments use it. */
export function useServiceActions() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const confirm = useConfirm();

  const remove = useCallback(
    async (service: Service): Promise<boolean> => {
      const name = localize(service.name);
      const upcoming = useAppointmentsStore
        .getState()
        .items.filter((a) => a.serviceId === service.id && isUpcoming(a, now())).length;
      const blocked = () =>
        confirm({
          title: t('services.blockedTitle'),
          description: t('services.blockedDescription', { name, count: format.number(upcoming) }),
          confirmLabel: t('common.gotIt'),
          infoOnly: true,
        });

      if (upcoming > 0) {
        await blocked();
        return false;
      }
      const accepted = await confirm({
        title: t('services.deleteTitle'),
        description: t('services.deleteDescription', { name }),
        confirmLabel: t('services.delete'),
        tone: 'danger',
      });
      if (!accepted) return false;

      try {
        await useCatalogStore.getState().removeService(service.id);
        useToastStore
          .getState()
          .push({ tone: 'success', message: t('toast.serviceDeleted', { name }) });
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
