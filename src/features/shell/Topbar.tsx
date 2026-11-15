import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { Kbd } from '@/components/ui/Kbd';
import { LanguageToggle } from '@/features/preferences/LanguageToggle';
import { ThemeToggle } from '@/features/preferences/ThemeToggle';
import { usePaletteStore } from '@/stores/paletteStore';

const IS_MAC = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

export function Topbar() {
  const { t } = useTranslation();
  const setOpen = usePaletteStore((state) => state.setOpen);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('shell.searchPlaceholder')}
        className="press flex min-h-11 w-full max-w-md items-center gap-3 rounded-md border border-line bg-canvas px-3 text-sm text-subtle hover:border-line-strong"
      >
        <Search className="size-5 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-start">{t('shell.searchPlaceholder')}</span>
        <Kbd>{IS_MAC ? '⌘ K' : 'Ctrl K'}</Kbd>
      </button>
      <div className="ms-auto flex items-center gap-2">
        <DemoBadge className="hidden lg:inline-flex" />
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
