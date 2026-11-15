import { create } from 'zustand';
import { repositories } from '@/data/repository';
import { DEFAULT_PREFERENCES } from '@/data/seed/preferences';
import type { Lang, Preferences, Theme } from '@/data/types';
import { SIDEBAR_MAX, SIDEBAR_MIN } from '@/theme/layout';

interface PrefsState extends Preferences {
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  resetSidebarWidth: () => void;
}

export const usePrefsStore = create<PrefsState>((set) => ({
  ...repositories.preferences.load(),
  setLang: (lang) => set({ lang }),
  setTheme: (theme) => set({ theme }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width)) }),
  resetSidebarWidth: () => set({ sidebarWidth: DEFAULT_PREFERENCES.sidebarWidth }),
}));
