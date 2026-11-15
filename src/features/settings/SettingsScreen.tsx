import { Moon, RotateCcw, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { useResetDemo } from '@/features/demo/useResetDemo';
import { usePrefsStore } from '@/stores/prefsStore';

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-6">
      <div className="max-w-md">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const lang = usePrefsStore((state) => state.lang);
  const theme = usePrefsStore((state) => state.theme);
  const setLang = usePrefsStore((state) => state.setLang);
  const setTheme = usePrefsStore((state) => state.setTheme);
  const resetDemo = useResetDemo();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <PageHeader title={t('settings.title')} />

      <section className="anim-rise-in divide-y divide-line rounded-lg border border-line bg-surface shadow-sm">
        <SettingRow title={t('settings.language')} description={t('settings.languageDescription')}>
          <Segmented
            label={t('settings.language')}
            value={lang}
            onChange={setLang}
            options={[
              { value: 'ar', label: t('settings.arabic'), lang: 'ar' },
              { value: 'en', label: t('settings.english'), lang: 'en' },
            ]}
          />
        </SettingRow>
        <SettingRow title={t('settings.theme')} description={t('settings.themeDescription')}>
          <Segmented
            label={t('settings.theme')}
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: t('settings.light'), icon: Sun },
              { value: 'dark', label: t('settings.dark'), icon: Moon },
            ]}
          />
        </SettingRow>
      </section>

      <section className="anim-rise-in rounded-lg border border-line bg-surface shadow-sm">
        <SettingRow title={t('settings.resetTitle')} description={t('settings.resetDescription')}>
          <Button variant="danger" onClick={() => void resetDemo()}>
            <RotateCcw className="size-4" aria-hidden />
            {t('settings.resetAction')}
          </Button>
        </SettingRow>
      </section>

      <section className="rounded-lg bg-sunken p-6">
        <h3 className="text-base font-semibold text-fg">{t('settings.aboutSection')}</h3>
        <p className="mt-1 text-sm text-muted">{t('settings.aboutBody')}</p>
      </section>
    </div>
  );
}
