import * as Popover from '@radix-ui/react-popover';
import { Bell } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { useFormat } from '@/i18n/useFormat';
import { useNotificationsStore } from '@/stores/notificationsStore';

// The list and its texts load the first time the panel opens.
const NotificationsPanel = lazy(() => import('./NotificationsPanel'));

export function NotificationsButton() {
  const { t } = useTranslation();
  const format = useFormat();
  const items = useNotificationsStore((state) => state.items);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.read).length;
  const label =
    unread > 0
      ? t('notifications.labelUnread', { count: format.number(unread) })
      : t('notifications.label');

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tooltip label={t('notifications.title')}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={label}
            className="press relative inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-fg"
          >
            <Bell className="size-5" aria-hidden />
            {unread > 0 && (
              <span
                aria-hidden
                className="anim-badge absolute end-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-danger px-1 text-xs font-semibold text-on-danger"
              >
                {unread > 9 ? `${format.number(9)}+` : format.number(unread)}
              </span>
            )}
          </button>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          className="panel z-[60] flex max-h-[32rem] w-[24rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
        >
          <Suspense
            fallback={
              <div className="flex flex-col gap-3 p-4" aria-busy>
                {[0, 1, 2].map((n) => (
                  <Skeleton key={n} className="h-14" />
                ))}
              </div>
            }
          >
            <NotificationsPanel onClose={() => setOpen(false)} />
          </Suspense>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
