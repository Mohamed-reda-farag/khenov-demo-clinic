import { useMemo } from 'react';
import { usePrefsStore } from '@/stores/prefsStore';
import { createFormatters } from './format';

export function useFormat() {
  const lang = usePrefsStore((state) => state.lang);
  return useMemo(() => createFormatters(lang), [lang]);
}
