import { Hourglass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import type { NavItem } from './nav';

/** Shown for screens that arrive in later milestones. */
export function PlaceholderScreen({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title={t(item.labelKey)} />
      <div className="rounded-lg border border-dashed border-line-strong bg-surface">
        <EmptyState
          icon={Hourglass}
          title={t('placeholder.title')}
          description={t('placeholder.description')}
        />
      </div>
    </div>
  );
}
