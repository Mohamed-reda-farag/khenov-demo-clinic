import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import type { Role } from '@/data/types';
import { useUiStore } from '@/stores/uiStore';
import { SHORTCUTS, type ShortcutGroup } from './shortcuts';

const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
const GROUPS: ShortcutGroup[] = ['general', 'calendar', 'goto'];

export function ShortcutsDialog({ role }: { role: Role }) {
  const { t } = useTranslation();
  const open = useUiStore((state) => state.shortcutsOpen);
  const setOpen = useUiStore((state) => state.setShortcutsOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-center p-4">
          <Dialog.Content className="panel flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <div className="flex items-start justify-between gap-4 border-b border-line p-6">
              <div>
                <Dialog.Title className="text-xl font-semibold text-fg">
                  {t('shortcuts.title')}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {t('shortcuts.description')}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <IconButton aria-label={t('common.close')}>
                  <X className="size-5" aria-hidden />
                </IconButton>
              </Dialog.Close>
            </div>
            <div className="flex flex-col gap-6 overflow-y-auto p-6">
              {GROUPS.map((group) => {
                const items = SHORTCUTS.filter((s) => s.group === group && s.roles.includes(role));
                if (items.length === 0) return null;
                return (
                  <section key={group} aria-labelledby={`shortcut-group-${group}`}>
                    <h3
                      id={`shortcut-group-${group}`}
                      className="mb-2 text-sm font-semibold text-muted"
                    >
                      {t(`shortcuts.groups.${group}`)}
                    </h3>
                    <ul className="divide-y divide-line rounded-lg border border-line">
                      {items.map((shortcut) => (
                        <li
                          key={shortcut.id}
                          className="flex min-h-11 items-center justify-between gap-4 px-4 py-2 text-sm"
                        >
                          <span className="text-fg">{t(`shortcuts.items.${shortcut.id}`)}</span>
                          <span className="flex items-center gap-2">
                            {shortcut.keys.map((key, index) => (
                              <span
                                key={`${shortcut.id}-${key}`}
                                className="flex items-center gap-2"
                              >
                                {index > 0 && shortcut.keys[0] === 'G' && (
                                  <span className="text-xs text-muted">{t('shortcuts.then')}</span>
                                )}
                                <Kbd>{key === 'mod' ? (IS_MAC ? '⌘' : 'Ctrl') : key}</Kbd>
                              </span>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
