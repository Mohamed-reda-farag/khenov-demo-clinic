import {
  Bell,
  BellOff,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  Globe,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { NotificationType } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { cn } from '@/lib/cn';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useUiStore } from '@/stores/uiStore';
import { useNotificationText } from './useNotificationText';

const ICONS: Record<NotificationType, LucideIcon> = {
  booked: CalendarPlus,
  rescheduled: CalendarClock,
  status: CalendarCheck,
  deleted: CalendarX2,
  onlineBooking: Globe,
  pendingReminder: Bell,
  welcome: Sparkles,
};

/** The content of the notifications popover (loaded the first time it opens). */
export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const now = useNow();
  const textOf = useNotificationText();
  const status = useNotificationsStore((state) => state.status);
  const items = useNotificationsStore((state) => state.items);
  const { load, markRead, markAllRead } = useNotificationsStore.getState();
  const appointments = useAppointmentsStore((state) => state.items);
  const openDetail = useUiStore((state) => state.openDetail);
  const unread = items.filter((n) => !n.read).length;

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <h2 className="text-lg font-semibold text-fg">{t('notifications.title')}</h2>
        <Button variant="ghost" disabled={unread === 0} onClick={() => void markAllRead()}>
          {t('notifications.markAllRead')}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === 'error' ? (
          <ErrorState
            title={t('notifications.errorTitle')}
            description={t('notifications.errorDescription')}
            onRetry={() => void load()}
          />
        ) : status !== 'ready' ? (
          <div className="flex flex-col gap-3 p-4" aria-busy>
            {[0, 1, 2].map((n) => (
              <Skeleton key={n} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={t('notifications.emptyTitle')}
            description={t('notifications.emptyDescription')}
          />
        ) : (
          <ul className="divide-y divide-line">
            {items.map((notification) => {
              const Icon = ICONS[notification.type];
              const target = notification.appointmentId
                ? appointments.find((a) => a.id === notification.appointmentId)
                : undefined;
              return (
                <li key={notification.id} className="anim-fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      void markRead(notification.id);
                      if (target) {
                        onClose();
                        openDetail(target.id);
                      }
                    }}
                    className={cn(
                      'flex min-h-14 w-full items-start gap-3 p-4 text-start hover:bg-sunken',
                      !notification.read && 'bg-primary-soft/40',
                    )}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-sm text-fg',
                          !notification.read && 'font-semibold',
                        )}
                      >
                        {textOf(notification)}
                      </span>
                      <span className="block text-xs text-muted">
                        {format.relative(notification.createdAt, now)}
                      </span>
                    </span>
                    {!notification.read && (
                      <>
                        <span
                          aria-hidden
                          className="mt-2 size-2.5 shrink-0 rounded-full bg-primary"
                        />
                        <span className="sr-only">{t('notifications.unread')}</span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
