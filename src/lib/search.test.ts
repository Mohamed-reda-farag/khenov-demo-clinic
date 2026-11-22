import { describe, expect, it } from 'vitest';
import type { Appointment, Doctor, Patient, Service } from '@/data/types';
import { searchAll, type SearchData } from './search';
import { normalizeSearch } from './text';

const now = new Date(2026, 10, 17, 12, 0);

const patient = (id: string, ar: string, en: string, phone: string): Patient => ({
  id,
  name: { ar, en },
  phone,
  age: 30,
});

const patients = [
  patient('p1', 'إسلام نبيل', 'Islam Nabil', '01005550101'),
  patient('p2', 'مليكة وائل', 'Malika Wael', '01005550202'),
  patient('p3', 'مُحَمَّد عبد الله', 'Mohamed Abdallah', '01005550303'),
  patient('p4', 'هبة الله شوقي', 'Hebatallah Shawky', '01005550404'),
  patient('p5', 'موسى عيسى', 'Mousa Eissa', '01005550505'),
  patient('p6', 'أحمد إسلام', 'Ahmed Islam', '01005550606'),
  patient('p7', 'يـــاسين محمود', 'Yassin Mahmoud', '01005550707'),
];

const doctor: Doctor = {
  id: 'dr-1',
  name: { ar: 'د. هالة منصور', en: 'Dr. Hala Mansour' },
  specialtyKey: 'internal',
  specialty: { ar: 'الباطنة', en: 'Internal Medicine' },
  colorToken: 'doctor-1',
  workStart: '09:00',
  workEnd: '21:00',
  active: true,
};
const service: Service = {
  id: 'sv-1',
  name: { ar: 'كشف باطنة', en: 'Internal medicine consultation' },
  specialtyKey: 'internal',
  durationMin: 30,
  priceEgp: 400,
};
const appointment = (id: string, patientId: string, day: number): Appointment => ({
  id,
  patientId,
  doctorId: 'dr-1',
  serviceId: 'sv-1',
  start: new Date(2026, 10, day, 10, 0).toISOString(),
  durationMin: 30,
  status: 'confirmed',
  visitNote: null,
  cancelReason: null,
});

const data: SearchData = {
  patients,
  doctors: [doctor],
  services: [service],
  appointments: [appointment('a1', 'p1', 17), appointment('a2', 'p1', 25)],
};
const names = (query: string) => searchAll(query, data, now).patients.map((r) => r.patient.id);

describe('Arabic normalization', () => {
  it('unifies alef variants', () => {
    expect(normalizeSearch('أحمد إسلام آدم')).toBe(normalizeSearch('احمد اسلام ادم'));
    expect(names('اسلام')).toContain('p1');
  });

  it('treats ya and alef maqsura the same', () => {
    expect(names('عيسي')).toEqual(['p5']);
    expect(names('موسي')).toEqual(['p5']);
  });

  it('treats ta marbuta and ha the same', () => {
    expect(names('مليكه')).toEqual(['p2']);
    expect(names('هبه')).toEqual(['p4']);
  });

  it('ignores diacritics and tatweel', () => {
    expect(names('محمد')).toEqual(['p3']);
    expect(names('ياسين')).toEqual(['p7']);
  });

  it('converts Arabic-Indic digits for phone search', () => {
    expect(names('٠١٠٠٥٥٥٠٢٠٢')).toEqual(['p2']);
  });
});

describe('ranking and matching', () => {
  it('finds English names and phone fragments', () => {
    expect(names('wael')).toEqual(['p2']);
    expect(names('5550303')).toEqual(['p3']);
  });

  it('ranks a name that starts with the query above one that merely contains it', () => {
    expect(names('islam')).toEqual(['p1', 'p6']); // "Islam Nabil" starts with it, "Ahmed Islam" does not
  });

  it('requires every word of the query to match', () => {
    expect(names('islam nabil')).toEqual(['p1']);
    expect(names('islam wael')).toEqual([]);
  });

  it('finds doctors by name or specialty and services by name', () => {
    expect(searchAll('هاله', data, now).doctors).toHaveLength(1);
    expect(searchAll('internal', data, now).doctors).toHaveLength(1);
    expect(searchAll('باطنه', data, now).services).toHaveLength(1);
  });

  it('finds appointments through their patient and prefers the one closest to today', () => {
    const results = searchAll('islam nabil', data, now).appointments;
    expect(results.map((r) => r.appointment.id)).toEqual(['a1', 'a2']);
  });

  it('returns nothing for an empty query', () => {
    expect(names('   ')).toEqual([]);
  });
});
