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
  const hour = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const dayNumber = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const monthYear = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const range = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return {
    number: (value: number) => number.format(value),
    currency: (value: number) => currency.format(value),
    date: (value: Date | string) => date.format(new Date(value)),
    time: (value: Date | string) => time.format(new Date(value)),
    percent: (value: number) => percent.format(value),
    hour: (value: Date) => hour.format(value),
    monthYear: (value: Date) => monthYear.format(value),
    /** "5 minutes ago", "yesterday"... */
    relative: (value: Date | string, now: Date) => {
      const minutes = Math.round((new Date(value).getTime() - now.getTime()) / 60_000);
      if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
      if (Math.abs(minutes) < 60 * 24) return relative.format(Math.round(minutes / 60), 'hour');
      return relative.format(Math.round(minutes / (60 * 24)), 'day');
    },
    weekday: (value: Date) => weekday.format(value),
    dayNumber: (value: Date) => dayNumber.format(value),
    dayMonth: (value: Date) => dayMonth.format(value),
    range: (from: Date, to: Date) => range.formatRange(from, to),
    /** 90 -> "1 h 30 m" / "١ س ٣٠ د". */
    duration: (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      const units = lang === 'ar' ? { h: 'س', m: 'د' } : { h: 'h', m: 'm' };
      return [
        h > 0 ? `${number.format(h)} ${units.h}` : '',
        m > 0 || h === 0 ? `${number.format(m)} ${units.m}` : '',
      ]
        .filter(Boolean)
        .join(' ');
    },
  };
}
