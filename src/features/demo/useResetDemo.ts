import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { resetData } from '@/data/repository';
import { useConfirm } from '@/components/ui/confirm';

/** Confirm, clear the demo namespace, reseed, then reload so every store starts fresh. */
export function useResetDemo(): () => Promise<void> {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return useCallback(async () => {
    const accepted = await confirm({
      title: t('settings.resetConfirmTitle'),
      description: t('settings.resetConfirmDescription'),
      confirmLabel: t('settings.resetConfirmAction'),
      tone: 'danger',
    });
    if (!accepted) return;
    resetData();
    window.location.hash = '#/login';
    window.location.reload();
  }, [confirm, t]);
}
