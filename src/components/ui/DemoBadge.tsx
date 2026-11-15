import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/cn';

export function DemoBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span
      dir="auto"
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-strong',
        className,
      )}
    >
      <Sparkles className="size-4" aria-hidden />
      {t('common.demoBadge')}
    </span>
  );
}
