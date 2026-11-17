import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';
import { useToastStore, type Toast } from '@/stores/toastStore';

const TONES = {
  success: { icon: CircleCheck, className: 'text-success' },
  error: { icon: CircleAlert, className: 'text-danger' },
  info: { icon: Info, className: 'text-primary-strong' },
} as const;

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation();
  const dismiss = useToastStore((state) => state.dismiss);
  const [paused, setPaused] = useState(false);
  const { icon: Icon, className } = TONES[toast.tone];

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => dismiss(toast.id), toast.tone === 'error' ? 8000 : 6000);
    return () => clearTimeout(timer);
  }, [paused, dismiss, toast.id, toast.tone]);

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : undefined}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-lg border border-line bg-surface p-3 ps-4 shadow-lg"
    >
      <Icon className={cn('size-5 shrink-0', className)} aria-hidden />
      <p className="min-w-0 flex-1 text-sm text-fg">{toast.message}</p>
      {toast.onAction && (
        <button
          type="button"
          onClick={() => {
            dismiss(toast.id);
            toast.onAction?.();
          }}
          className="press min-h-11 rounded-md px-3 text-sm font-semibold text-primary-strong hover:bg-primary-soft"
        >
          {toast.actionLabel}
        </button>
      )}
      <button
        type="button"
        aria-label={t('toast.dismiss')}
        onClick={() => dismiss(toast.id)}
        className="press inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-fg"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

export function ToastViewport() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div
      role="region"
      aria-label={t('toast.region')}
      // A live region stays exposed to screen readers even while a modal dialog is open.
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
