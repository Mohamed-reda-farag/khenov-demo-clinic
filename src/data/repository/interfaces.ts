import type {
  Appointment,
  Doctor,
  Patient,
  Preferences,
  Role,
  Service,
  Session,
} from '@/data/types';

export interface DoctorRepository {
  list(): Promise<Doctor[]>;
  getById(id: string): Promise<Doctor | null>;
}

export interface PatientRepository {
  list(): Promise<Patient[]>;
}

export interface ServiceRepository {
  list(): Promise<Service[]>;
}

export interface AppointmentRepository {
  /** Appointments whose start falls inside [from, to], ordered by start. */
  listByRange(from: Date, to: Date): Promise<Appointment[]>;
}

export interface SessionRepository {
  get(): Session | null;
  login(role: Role): Promise<Session>;
  logout(): Promise<void>;
}

export interface PreferencesRepository {
  load(): Preferences;
  save(preferences: Preferences): void;
}

export interface Repositories {
  doctors: DoctorRepository;
  patients: PatientRepository;
  services: ServiceRepository;
  appointments: AppointmentRepository;
  session: SessionRepository;
  preferences: PreferencesRepository;
}
