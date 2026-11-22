import { describe, expect, it } from 'vitest';
import type { Appointment, Patient } from '@/data/types';
import { buildPatientRows, queryPatients } from './query';

const now = new Date(2026, 10, 17, 12, 0);
const patient = (id: string, ar: string, en: string, age: number | null): Patient => ({
  id,
  name: { ar, en },
  phone: `0100555${id.padStart(4, '0')}`,
  age,
});
const patients = [
  patient('1', 'سلمى', 'Salma', 30),
  patient('2', 'أحمد', 'Ahmed', null),
  patient('3', 'منى', 'Mona', 20),
];
const appointment = (
  patientId: string,
  day: number,
  status: Appointment['status'],
): Appointment => ({
  id: `ap-${patientId}-${day}`,
  patientId,
  doctorId: 'dr-1',
  serviceId: 'sv-1',
  start: new Date(2026, 10, day, 10, 0).toISOString(),
  durationMin: 30,
  status,
  visitNote: null,
  cancelReason: null,
});
const rows = buildPatientRows(
  patients,
  [
    appointment('1', 20, 'confirmed'),
    appointment('1', 10, 'done'),
    appointment('3', 18, 'pending'),
    appointment('3', 5, 'done'),
    appointment('3', 6, 'done'),
  ],
  now,
);
const ids = (result: ReturnType<typeof queryPatients>) => result.map((r) => r.patient.id);
const base = { query: '', sort: 'name' as const, filter: 'all' as const, lang: 'en' as const };

describe('patient rows', () => {
  it('counts completed visits, upcoming appointments and the next one', () => {
    expect(rows[0]).toMatchObject({ visits: 1, upcoming: 1 });
    expect(rows[0]?.next?.id).toBe('ap-1-20');
    expect(rows[1]).toMatchObject({ visits: 0, upcoming: 0, next: null });
  });
});

describe('queryPatients', () => {
  it('sorts by name, age (unknown last), next appointment and visits', () => {
    expect(ids(queryPatients(rows, base))).toEqual(['2', '3', '1']);
    expect(ids(queryPatients(rows, { ...base, sort: 'age' }))).toEqual(['3', '1', '2']);
    expect(ids(queryPatients(rows, { ...base, sort: 'next' }))).toEqual(['3', '1', '2']);
    expect(ids(queryPatients(rows, { ...base, sort: 'visits' }))[0]).toBe('3');
  });

  it('filters by upcoming appointments', () => {
    expect(ids(queryPatients(rows, { ...base, filter: 'upcoming' })).sort()).toEqual(['1', '3']);
    expect(ids(queryPatients(rows, { ...base, filter: 'none' }))).toEqual(['2']);
  });

  it('searches names in both languages (with letter variants) and phones', () => {
    expect(ids(queryPatients(rows, { ...base, query: 'احمد' }))).toEqual(['2']);
    expect(ids(queryPatients(rows, { ...base, query: 'mona' }))).toEqual(['3']);
    expect(ids(queryPatients(rows, { ...base, query: '٠٠٠١' }))).toEqual(['1']);
  });
});
