import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="anim-fade-in flex flex-col items-center gap-4 px-6 py-16 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-lg bg-danger-soft text-danger">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </div>
  );
}
