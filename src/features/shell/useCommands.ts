import {
  CalendarPlus,
  Keyboard,
  Languages,
  LogOut,
  Repeat,
  RotateCcw,
  SunMoon,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/data/types';
import { useResetDemo } from '@/features/demo/useResetDemo';
import { usePrefsStore } from '@/stores/prefsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore } from '@/stores/uiStore';
import { homePathFor, navFor } from './nav';

export type CommandGroup =
  | 'actions'
  | 'patients'
  | 'appointments'
  | 'doctors'
  | 'services'
  | 'navigate'
  | 'preferences'
  | 'demo'
  | 'session';

/** Display order in the palette. */
export const COMMAND_GROUPS: CommandGroup[] = [
  'actions',
  'patients',
  'doctors',
  'services',
  // Appointments rank below the people and things they belong to.
  'appointments',
  'navigate',
  'preferences',
  'demo',
  'session',
];

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** Second line (search results). */
  description?: string;
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
  const login = useSessionStore((state) => state.login);
  const logout = useSessionStore((state) => state.logout);
  const setShortcutsOpen = useUiStore((state) => state.setShortcutsOpen);
  const otherRole: Role = role === 'receptionist' ? 'doctor' : 'receptionist';
  const resetDemo = useResetDemo();
  const openForm = useUiStore((state) => state.openForm);

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

  const actions: Command[] =
    role === 'receptionist'
      ? [
          {
            id: 'new-appointment',
            group: 'actions',
            label: t('palette.newAppointment'),
            keywords: `${bothLanguages('palette.newAppointment')} book حجز`,
            icon: CalendarPlus,
            run: () => openForm({ mode: 'create' }),
          },
        ]
      : [];

  return [
    ...actions,
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
      id: 'shortcuts',
      group: 'preferences',
      label: t('palette.shortcuts'),
      keywords: `${bothLanguages('palette.shortcuts')} keyboard shortcuts اختصارات`,
      icon: Keyboard,
      run: () => setShortcutsOpen(true),
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
      id: 'switch-role',
      group: 'session',
      label: t('shell.switchTo', { role: t(`roles.${otherRole}`) }),
      keywords: `${bothLanguages('shell.switchRole')} switch role`,
      icon: Repeat,
      run: () => {
        void login(otherRole).then(() => navigate(homePathFor(otherRole)));
      },
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
