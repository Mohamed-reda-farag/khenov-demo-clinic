import { repositories } from '@/data/repository';
import {
  BarChart3,
  CalendarDays,
  CircleCheck,
  ConciergeBell,
  ListChecks,
  Stethoscope,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/DemoBadge';
import type { Role } from '@/data/types';
import { LanguageToggle } from '@/features/preferences/LanguageToggle';
import { ThemeToggle } from '@/features/preferences/ThemeToggle';
import { cn } from '@/lib/cn';
import { useSessionStore } from '@/stores/sessionStore';

const ROLES = [
  { role: 'receptionist', icon: ConciergeBell, descriptionKey: 'login.receptionistDesc' },
  { role: 'doctor', icon: Stethoscope, descriptionKey: 'login.doctorDesc' },
] as const;

const HIGHLIGHTS = [
  { icon: CalendarDays, key: 'login.highlight1' },
  { icon: ListChecks, key: 'login.highlight2' },
  { icon: BarChart3, key: 'login.highlight3' },
] as const;

export function LoginScreen() {
  const { t } = useTranslation();
  const login = useSessionStore((state) => state.login);
  const [role, setRole] = useState<Role>('receptionist');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // Shown once after "Reset demo" (the flag is cleared as soon as the screen is up).
  const [justReset] = useState(() => repositories.preferences.hasResetNotice());
  useEffect(() => {
    repositories.preferences.clearResetNotice();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    try {
      await login(role);
    } catch {
      setFailed(true);
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="brand-panel hidden flex-col justify-between p-12 text-on-brand lg:flex">
        <BrandMark name={t('app.name')} light />
        <div className="anim-rise-in max-w-md">
          <h2 className="text-3xl font-semibold text-on-brand">{t('login.brandHeadline')}</h2>
          <p className="mt-4 text-base text-on-brand opacity-90">{t('login.brandBody')}</p>
          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-sm text-on-brand">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-on-brand/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-on-brand opacity-80">{t('app.tagline')}</p>
      </section>

      <main className="flex flex-col bg-canvas">
        <div className="flex items-center justify-between gap-2 p-6">
          <BrandMark name={t('app.name')} className="lg:invisible" />
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <form onSubmit={onSubmit} className="anim-rise-in w-full max-w-md">
            <h1 className="text-2xl font-semibold text-fg">{t('login.title')}</h1>
            <p className="mt-2 text-sm text-muted">{t('login.subtitle')}</p>

            {justReset && (
              <p
                role="status"
                className="mt-6 flex items-start gap-3 rounded-md bg-success-soft p-4 text-sm text-success"
              >
                <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
                {t('login.resetDone')}
              </p>
            )}

            <div
              role="radiogroup"
              aria-label={t('login.title')}
              className="mt-8 flex flex-col gap-3"
            >
              {ROLES.map(({ role: value, icon: Icon, descriptionKey }) => (
                <label key={value} className="block">
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={role === value}
                    onChange={() => setRole(value)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      'flex items-center gap-4 rounded-lg border bg-surface p-4 shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus',
                      role === value
                        ? 'border-primary bg-primary-soft'
                        : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-12 shrink-0 items-center justify-center rounded-md',
                        role === value ? 'bg-primary text-on-primary' : 'bg-sunken text-muted',
                      )}
                    >
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-base font-semibold text-fg">
                        {t(`roles.${value}`)}
                      </span>
                      <span className="block text-sm text-muted">{t(descriptionKey)}</span>
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {failed && (
              <div role="alert" className="mt-4 rounded-md bg-danger-soft p-4 text-sm text-danger">
                <p className="font-semibold">{t('login.failedTitle')}</p>
                <p>{t('login.failedDescription')}</p>
              </div>
            )}

            <Button type="submit" loading={busy} fullWidth className="mt-6 min-h-12">
              {busy ? t('login.continuing') : t('login.continue')}
            </Button>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-subtle">{t('login.note')}</p>
              <DemoBadge />
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
