import { SPECIALTIES } from '@/data/specialties';
import type { Doctor } from '@/data/types';

export const doctors: Doctor[] = [
  {
    id: 'dr-1',
    name: { ar: 'د. هالة منصور', en: 'Dr. Hala Mansour' },
    specialtyKey: 'internal',
    specialty: SPECIALTIES.internal,
    colorToken: 'doctor-1',
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  },
  {
    id: 'dr-2',
    name: { ar: 'د. كريم الشريف', en: 'Dr. Karim El-Sherif' },
    specialtyKey: 'pediatrics',
    specialty: SPECIALTIES.pediatrics,
    colorToken: 'doctor-2',
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  },
  {
    id: 'dr-3',
    name: { ar: 'د. نادين فؤاد', en: 'Dr. Nadine Fouad' },
    specialtyKey: 'dental',
    specialty: SPECIALTIES.dental,
    colorToken: 'doctor-3',
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  },
  {
    id: 'dr-4',
    name: { ar: 'د. عمر الجوهري', en: 'Dr. Omar El-Gohary' },
    specialtyKey: 'dermatology',
    specialty: SPECIALTIES.dermatology,
    colorToken: 'doctor-4',
    workStart: '09:00',
    workEnd: '21:00',
    active: true,
  },
];
