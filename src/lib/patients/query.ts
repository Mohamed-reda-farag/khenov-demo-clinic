import type { Appointment, Lang, Patient } from '@/data/types';
import { phoneMatches } from '@/lib/phone';
import { scoreFields } from '@/lib/search';
import { normalizeSearch } from '@/lib/text';
import { isUpcoming } from '@/lib/scheduling/rules';

export type PatientSort = 'name' | 'age' | 'next' | 'visits';
export type PatientFilter = 'all' | 'upcoming' | 'none';

export interface PatientRow {
  patient: Patient;
  /** The soonest upcoming appointment. */
  next: Appointment | null;
  /** Completed visits. */
  visits: number;
  upcoming: number;
}

export function buildPatientRows(
  patients: readonly Patient[],
  appointments: readonly Appointment[],
  now: Date,
): PatientRow[] {
  const byPatient = new Map<string, Appointment[]>();
  for (const appointment of appointments) {
    byPatient.set(appointment.patientId, [
      ...(byPatient.get(appointment.patientId) ?? []),
      appointment,
    ]);
  }
  return patients.map((patient) => {
    const mine = byPatient.get(patient.id) ?? [];
    const upcoming = mine
      .filter((a) => isUpcoming(a, now))
      .sort((a, b) => a.start.localeCompare(b.start));
    return {
      patient,
      next: upcoming[0] ?? null,
      visits: mine.filter((a) => a.status === 'done').length,
      upcoming: upcoming.length,
    };
  });
}

interface PatientQuery {
  query: string;
  sort: PatientSort;
  filter: PatientFilter;
  lang: Lang;
}

export function queryPatients(rows: readonly PatientRow[], options: PatientQuery): PatientRow[] {
  const { query, sort, filter, lang } = options;
  const matching = rows.filter((row) => {
    if (filter === 'upcoming' && row.upcoming === 0) return false;
    if (filter === 'none' && row.upcoming > 0) return false;
    if (!normalizeSearch(query)) return true;
    const { name, phone } = row.patient;
    return (
      scoreFields(query, [normalizeSearch(name.ar), normalizeSearch(name.en)]) > 0 ||
      phoneMatches(query, phone)
    );
  });

  const nullsLast = (a: number | null, b: number | null) =>
    a === b ? 0 : a === null ? 1 : b === null ? -1 : a - b;
  return [...matching].sort((a, b) => {
    switch (sort) {
      case 'age':
        return nullsLast(a.patient.age, b.patient.age);
      case 'next':
        return nullsLast(
          a.next ? new Date(a.next.start).getTime() : null,
          b.next ? new Date(b.next.start).getTime() : null,
        );
      case 'visits':
        return b.visits - a.visits;
      default:
        return a.patient.name[lang].localeCompare(b.patient.name[lang], lang);
    }
  });
}
