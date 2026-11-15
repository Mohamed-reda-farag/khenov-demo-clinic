import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Lang } from '@/data/types';
import ar from './ar.json';
import en from './en.json';

export function applyLanguage(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = i18n.t('app.documentTitle');
}

export async function initI18n(lang: Lang): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: { ar: { translation: ar }, en: { translation: en } },
    lng: lang,
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
  });
  i18n.on('languageChanged', (next) => applyLanguage(next === 'en' ? 'en' : 'ar'));
  applyLanguage(lang);
}

export { i18n };
