import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { usePrefsStore } from '@/stores/prefsStore';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = usePrefsStore((state) => state.theme);
  const setTheme = usePrefsStore((state) => state.setTheme);
  const Icon = theme === 'light' ? Moon : Sun;

  return (
    <Tooltip label={t('shell.toggleTheme')}>
      <IconButton
        aria-label={t('shell.toggleTheme')}
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      >
        <Icon className="size-5" aria-hidden />
      </IconButton>
    </Tooltip>
  );
}
