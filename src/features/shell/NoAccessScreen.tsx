import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Role } from '@/data/types';
import { homePathFor } from './nav';

/** Friendly message instead of a silent redirect when a role opens a screen that isn't for it. */
export function NoAccessScreen({ role }: { role: Role }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <EmptyState
        icon={Lock}
        title={t('access.title')}
        description={t('access.description', { role: t(`roles.${role}`) })}
        action={
          <Link to={homePathFor(role)} className={buttonStyles('primary')}>
            {t('access.back')}
          </Link>
        }
      />
    </div>
  );
}
