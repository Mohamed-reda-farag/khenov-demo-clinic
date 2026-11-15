import { useCallback } from 'react';
import type { Bilingual } from '@/data/types';
import { usePrefsStore } from '@/stores/prefsStore';

/** Returns a function that picks the Arabic or English side of a Bilingual value. */
export function useLocalized() {
  const lang = usePrefsStore((state) => state.lang);
  return useCallback((value: Bilingual) => value[lang], [lang]);
}
