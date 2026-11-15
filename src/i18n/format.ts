import type { Lang } from '@/data/types';

const LOCALES: Record<Lang, string> = { ar: 'ar-EG', en: 'en-EG' };

export function createFormatters(lang: Lang) {
  const locale = LOCALES[lang];
  const number = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  });
  const date = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });

  return {
    number: (value: number) => number.format(value),
    currency: (value: number) => currency.format(value),
    date: (value: Date | string) => date.format(new Date(value)),
    time: (value: Date | string) => time.format(new Date(value)),
  };
}
