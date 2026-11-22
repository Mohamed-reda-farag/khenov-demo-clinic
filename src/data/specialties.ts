import type { Bilingual, SpecialtyKey } from './types';

export const SPECIALTIES: Record<SpecialtyKey, Bilingual> = {
  internal: { ar: 'الباطنة', en: 'Internal Medicine' },
  pediatrics: { ar: 'طب الأطفال', en: 'Pediatrics' },
  dental: { ar: 'طب الأسنان', en: 'Dentistry' },
  dermatology: { ar: 'الأمراض الجلدية', en: 'Dermatology' },
};

export const SPECIALTY_KEYS = Object.keys(SPECIALTIES) as SpecialtyKey[];
