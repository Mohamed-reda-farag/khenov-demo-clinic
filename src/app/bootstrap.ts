import { initData, repositories } from '@/data/repository';
import { initI18n, i18n } from '@/i18n';
import { usePrefsStore } from '@/stores/prefsStore';

function applyTheme(theme: string): void {
  document.documentElement.dataset.theme = theme;
}

/** Seeds data, starts i18n and keeps document language/direction/theme + saved prefs in sync. */
export async function bootstrap(): Promise<void> {
  initData();
  const { lang, theme } = usePrefsStore.getState();
  await initI18n(lang);
  applyTheme(theme);

  usePrefsStore.subscribe((state, previous) => {
    if (state.lang !== previous.lang) void i18n.changeLanguage(state.lang);
    if (state.theme !== previous.theme) applyTheme(state.theme);
    repositories.preferences.save({
      lang: state.lang,
      theme: state.theme,
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
    });
  });
}
