import type { Doctor } from '@/data/types';

export const doctors: Doctor[] = [
  {
    id: 'dr-1',
    name: { ar: 'د. هالة منصور', en: 'Dr. Hala Mansour' },
    specialtyKey: 'internal',
    specialty: { ar: 'الباطنة', en: 'Internal Medicine' },
    colorToken: 'doctor-1',
    workStart: '09:00',
    workEnd: '21:00',
  },
  {
    id: 'dr-2',
    name: { ar: 'د. كريم الشريف', en: 'Dr. Karim El-Sherif' },
    specialtyKey: 'pediatrics',
    specialty: { ar: 'طب الأطفال', en: 'Pediatrics' },
    colorToken: 'doctor-2',
    workStart: '09:00',
    workEnd: '21:00',
  },
  {
    id: 'dr-3',
    name: { ar: 'د. نادين فؤاد', en: 'Dr. Nadine Fouad' },
    specialtyKey: 'dental',
    specialty: { ar: 'طب الأسنان', en: 'Dentistry' },
    colorToken: 'doctor-3',
    workStart: '09:00',
    workEnd: '21:00',
  },
  {
    id: 'dr-4',
    name: { ar: 'د. عمر الجوهري', en: 'Dr. Omar El-Gohary' },
    specialtyKey: 'dermatology',
    specialty: { ar: 'الأمراض الجلدية', en: 'Dermatology' },
    colorToken: 'doctor-4',
    workStart: '09:00',
    workEnd: '21:00',
  },
];
