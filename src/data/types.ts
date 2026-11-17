export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark';
export type Role = 'receptionist' | 'doctor';

export interface Bilingual {
  ar: string;
  en: string;
}

export type SpecialtyKey = 'internal' | 'pediatrics' | 'dental' | 'dermatology';

export interface Doctor {
  id: string;
  name: Bilingual;
  specialtyKey: SpecialtyKey;
  specialty: Bilingual;
  colorToken: 'doctor-1' | 'doctor-2' | 'doctor-3' | 'doctor-4';
  workStart: string;
  workEnd: string;
}

export interface Patient {
  id: string;
  name: Bilingual;
  phone: string;
  /** `null` for patients added with the quick-add form. */
  age: number | null;
}

export interface Service {
  id: string;
  name: Bilingual;
  specialtyKey: SpecialtyKey;
  durationMin: number;
  priceEgp: number;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'arrived' | 'done' | 'cancelled';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  /** ISO 8601 start time. */
  start: string;
  durationMin: number;
  status: AppointmentStatus;
  /** Short non-medical visit note written by the doctor. */
  visitNote: string | null;
  /** Optional reason typed when the appointment is cancelled. */
  cancelReason: string | null;
}

export interface Session {
  role: Role;
  doctorId: string | null;
}

export interface Preferences {
  lang: Lang;
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
}
