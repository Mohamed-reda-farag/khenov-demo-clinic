import { Languages, LogOut, RotateCcw, SunMoon, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/data/types';
import { useResetDemo } from '@/features/demo/useResetDemo';
import { usePrefsStore } from '@/stores/prefsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { navFor } from './nav';

export type CommandGroup = 'navigate' | 'preferences' | 'demo' | 'session';
export const COMMAND_GROUPS: CommandGroup[] = ['navigate', 'preferences', 'demo', 'session'];

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** Extra searchable text (both languages). */
  keywords: string;
  icon: LucideIcon;
  run: () => void;
}

export function useCommands(role: Role): Command[] {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = usePrefsStore((state) => state.lang);
  const theme = usePrefsStore((state) => state.theme);
  const setLang = usePrefsStore((state) => state.setLang);
  const setTheme = usePrefsStore((state) => state.setTheme);
  const logout = useSessionStore((state) => state.logout);
  const resetDemo = useResetDemo();

  const tAr = i18n.getFixedT('ar');
  const tEn = i18n.getFixedT('en');
  const bothLanguages = (key: string) => `${tAr(key)} ${tEn(key)}`;

  const navigation: Command[] = navFor(role).map((item) => ({
    id: `nav-${item.id}`,
    group: 'navigate',
    label: t(item.labelKey),
    keywords: bothLanguages(item.labelKey),
    icon: item.icon,
    run: () => void navigate(item.path),
  }));

  return [
    ...navigation,
    {
      id: 'switch-language',
      group: 'preferences',
      label: t('palette.switchLanguage'),
      keywords: `${bothLanguages('settings.language')} language لغة`,
      icon: Languages,
      run: () => setLang(lang === 'ar' ? 'en' : 'ar'),
    },
    {
      id: 'toggle-theme',
      group: 'preferences',
      label: t('palette.toggleTheme'),
      keywords: `${bothLanguages('settings.theme')} dark light theme داكن فاتح`,
      icon: SunMoon,
      run: () => setTheme(theme === 'light' ? 'dark' : 'light'),
    },
    {
      id: 'reset-demo',
      group: 'demo',
      label: t('palette.resetDemo'),
      keywords: `${bothLanguages('settings.resetTitle')} reset demo`,
      icon: RotateCcw,
      run: () => void resetDemo(),
    },
    {
      id: 'sign-out',
      group: 'session',
      label: t('palette.signOut'),
      keywords: `${bothLanguages('shell.signOut')} logout sign out خروج`,
      icon: LogOut,
      run: () => void logout(),
    },
  ];
}
