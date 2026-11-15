import type { Service } from '@/data/types';

export const services: Service[] = [
  {
    id: 'sv-1',
    name: { ar: 'كشف باطنة', en: 'Internal medicine consultation' },
    specialtyKey: 'internal',
    durationMin: 30,
    priceEgp: 400,
  },
  {
    id: 'sv-2',
    name: { ar: 'متابعة باطنة', en: 'Internal medicine follow-up' },
    specialtyKey: 'internal',
    durationMin: 15,
    priceEgp: 250,
  },
  {
    id: 'sv-3',
    name: { ar: 'فحص دوري شامل', en: 'Full check-up' },
    specialtyKey: 'internal',
    durationMin: 45,
    priceEgp: 650,
  },
  {
    id: 'sv-4',
    name: { ar: 'كشف أطفال', en: 'Pediatric consultation' },
    specialtyKey: 'pediatrics',
    durationMin: 30,
    priceEgp: 350,
  },
  {
    id: 'sv-5',
    name: { ar: 'متابعة نمو', en: 'Growth follow-up' },
    specialtyKey: 'pediatrics',
    durationMin: 15,
    priceEgp: 200,
  },
  {
    id: 'sv-6',
    name: { ar: 'كشف وتنظيف أسنان', en: 'Dental exam and cleaning' },
    specialtyKey: 'dental',
    durationMin: 45,
    priceEgp: 500,
  },
  {
    id: 'sv-7',
    name: { ar: 'حشو تجميلي', en: 'Cosmetic filling' },
    specialtyKey: 'dental',
    durationMin: 45,
    priceEgp: 750,
  },
  {
    id: 'sv-8',
    name: { ar: 'كشف جلدية', en: 'Dermatology consultation' },
    specialtyKey: 'dermatology',
    durationMin: 30,
    priceEgp: 450,
  },
  {
    id: 'sv-9',
    name: { ar: 'جلسة تقشير خفيف', en: 'Light peel session' },
    specialtyKey: 'dermatology',
    durationMin: 45,
    priceEgp: 900,
  },
];
