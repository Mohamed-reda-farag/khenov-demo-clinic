import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { usePrefsStore } from '@/stores/prefsStore';

export function LanguageToggle() {
  const { t } = useTranslation();
  const lang = usePrefsStore((state) => state.lang);
  const setLang = usePrefsStore((state) => state.setLang);
  const next = lang === 'ar' ? 'en' : 'ar';

  return (
    <Button variant="ghost" aria-label={t('shell.switchLanguage')} onClick={() => setLang(next)}>
      <Languages className="size-5" aria-hidden />
      <span lang={next}>{next === 'ar' ? 'العربية' : 'English'}</span>
    </Button>
  );
}
