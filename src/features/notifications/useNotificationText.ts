import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppNotification } from '@/data/types';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';

/** Builds the notification sentence in the current language from the stored fields. */
export function useNotificationText() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const { patientById } = useCatalogMaps();

  return useCallback(
    (notification: AppNotification): string => {
      const patient = notification.patientId ? patientById.get(notification.patientId) : undefined;
      const name = patient ? localize(patient.name) : t('common.unknownPatient');
      const when = notification.when
        ? `${format.dayMonth(new Date(notification.when))} ${format.time(notification.when)}`
        : '';
      switch (notification.type) {
        case 'status':
          return t(`notifications.messages.status_${notification.status ?? 'done'}`, {
            patient: name,
          });
        case 'pendingReminder':
          return t('notifications.messages.pendingReminder', {
            count: format.number(notification.count ?? 0),
          });
        default:
          return t(`notifications.messages.${notification.type}`, { patient: name, when });
      }
    },
    [t, format, localize, patientById],
  );
}
