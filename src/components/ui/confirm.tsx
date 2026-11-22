import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  /** Just a message with one button (nothing to confirm). */
  infoOnly?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Promise-based confirm dialog. `const confirm = useConfirm(); if (await confirm({...})) ...` */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog.Root open={open} onOpenChange={(next) => !next && settle(false)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="overlay grid place-items-center p-4">
            <AlertDialog.Content className="panel w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-lg">
              <AlertDialog.Title className="text-lg font-semibold text-fg">
                {options?.title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-muted">
                {options?.description}
              </AlertDialog.Description>
              <div className="mt-6 flex justify-end gap-2">
                <AlertDialog.Cancel asChild>
                  <Button variant="secondary">{t('common.cancel')}</Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    variant={options?.tone === 'danger' ? 'danger' : 'primary'}
                    onClick={() => settle(true)}
                  >
                    {options?.confirmLabel}
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Overlay>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </ConfirmContext.Provider>
  );
}
