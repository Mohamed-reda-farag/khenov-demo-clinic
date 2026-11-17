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

export interface NewPatientInput {
  name: string;
  phone: string;
}

export interface PatientRepository {
  list(): Promise<Patient[]>;
  /** Quick add: name + phone only. Throws RepositoryError('validation'). */
  create(input: NewPatientInput): Promise<Patient>;
}

export interface ServiceRepository {
  list(): Promise<Service[]>;
}

export interface AppointmentDraft {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  /** ISO 8601. */
  start: string;
}

export type AppointmentPatch = Partial<
  Pick<
    Appointment,
    'patientId' | 'doctorId' | 'serviceId' | 'start' | 'status' | 'visitNote' | 'cancelReason'
  >
>;

/**
 * All writes enforce the booking rules (doctor / patient overlap, working hours) and the status
 * flow, and throw RepositoryError ('conflict', 'invalid_transition', 'not_found').
 */
export interface AppointmentRepository {
  list(): Promise<Appointment[]>;
  /** New appointments start as `pending`; the duration comes from the service. */
  create(draft: AppointmentDraft): Promise<Appointment>;
  update(id: string, patch: AppointmentPatch): Promise<Appointment>;
  remove(id: string): Promise<Appointment>;
  /** Puts a previous snapshot back (undo). Inserts it if it was deleted. Skips the status flow check. */
  restore(snapshot: Appointment): Promise<Appointment>;
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
