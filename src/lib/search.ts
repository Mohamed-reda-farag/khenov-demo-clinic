import type { Appointment, Bilingual, Doctor, Patient, Service } from '@/data/types';
import { normalizePhone } from './phone';
import { normalizeSearch } from './text';

export interface SearchData {
  patients: readonly Patient[];
  doctors: readonly Doctor[];
  services: readonly Service[];
  appointments: readonly Appointment[];
}

export interface SearchResults {
  patients: Array<{ patient: Patient; score: number }>;
  appointments: Array<{
    appointment: Appointment;
    patient?: Patient;
    doctor?: Doctor;
    service?: Service;
    score: number;
  }>;
  doctors: Array<{ doctor: Doctor; score: number }>;
  services: Array<{ service: Service; score: number }>;
}

const bilingual = (value: Bilingual) => [normalizeSearch(value.ar), normalizeSearch(value.en)];

/** 100 exact, 80 starts with, 70 a word starts with, 50 contains, 0 no match. */
function textScore(token: string, field: string): number {
  if (!field.includes(token)) return 0;
  if (field === token) return 100;
  if (field.startsWith(token)) return 80;
  return field.split(' ').some((word) => word.startsWith(token)) ? 70 : 50;
}

/** Every word of the query must match some field; the score is the average of the best matches. */
export function scoreFields(query: string, fields: readonly string[]): number {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  let sum = 0;
  for (const token of tokens) {
    const best = Math.max(...fields.map((field) => textScore(token, field)));
    if (best === 0) return 0;
    sum += best;
  }
  return Math.round(sum / tokens.length);
}

function phoneScore(query: string, phone: string): number {
  const digits = normalizePhone(query);
  if (digits.length < 3 || digits.length !== normalizeSearch(query).replace(/\s/g, '').length)
    return 0;
  if (phone === digits) return 100;
  if (phone.startsWith(digits)) return 75;
  return phone.includes(digits) ? 60 : 0;
}

const byScore = <T extends { score: number }>(a: T, b: T) => b.score - a.score;

/** Matches patients, appointments, doctors and services. Arabic/English, diacritics and letter variants ignored. */
export function searchAll(query: string, data: SearchData, now: Date, limit = 5): SearchResults {
  const patientById = new Map(data.patients.map((p) => [p.id, p]));
  const doctorById = new Map(data.doctors.map((d) => [d.id, d]));
  const serviceById = new Map(data.services.map((s) => [s.id, s]));
  const patientScore = (p: Patient) =>
    Math.max(scoreFields(query, bilingual(p.name)), phoneScore(query, p.phone));

  const patients = data.patients
    .map((patient) => ({ patient, score: patientScore(patient) }))
    .filter((r) => r.score > 0)
    .sort(byScore);

  const doctors = data.doctors
    .map((doctor) => ({
      doctor,
      score: scoreFields(query, [...bilingual(doctor.name), ...bilingual(doctor.specialty)]),
    }))
    .filter((r) => r.score > 0)
    .sort(byScore);

  const services = data.services
    .map((service) => ({ service, score: scoreFields(query, bilingual(service.name)) }))
    .filter((r) => r.score > 0)
    .sort(byScore);

  const appointments = data.appointments
    .map((appointment) => {
      const patient = patientById.get(appointment.patientId);
      const doctor = doctorById.get(appointment.doctorId);
      const service = serviceById.get(appointment.serviceId);
      const score = Math.max(
        patient ? patientScore(patient) : 0,
        doctor ? scoreFields(query, bilingual(doctor.name)) : 0,
        service ? scoreFields(query, bilingual(service.name)) : 0,
      );
      // Appointments rank below the people / things they belong to.
      return { appointment, patient, doctor, service, score: score > 0 ? score - 20 : 0 };
    })
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(new Date(a.appointment.start).getTime() - now.getTime()) -
          Math.abs(new Date(b.appointment.start).getTime() - now.getTime()),
    );

  return {
    patients: patients.slice(0, limit),
    appointments: appointments.slice(0, limit),
    doctors: doctors.slice(0, limit),
    services: services.slice(0, limit),
  };
}
