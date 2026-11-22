import type { DoctorReportData, RangeKey } from '@/lib/reports/aggregate';
import type {
  AppNotification,
  Appointment,
  Bilingual,
  Doctor,
  NotificationDraft,
  Patient,
  Preferences,
  Role,
  Service,
  Session,
  SpecialtyKey,
} from '@/data/types';

export interface DoctorInput {
  name: Bilingual;
  specialtyKey: SpecialtyKey;
  workStart: string;
  workEnd: string;
  active: boolean;
}

export interface DoctorRepository {
  list(): Promise<Doctor[]>;
  getById(id: string): Promise<Doctor | null>;
  /**
   * Throws RepositoryError: 'validation' (names, hours inside the calendar grid) or 'in_use'
   * when upcoming appointments would fall outside the new hours or no longer match the specialty.
   */
  update(id: string, input: DoctorInput): Promise<Doctor>;
}

export interface PatientInput {
  name: Bilingual;
  phone: string;
  /** `null` when unknown. */
  age: number | null;
}

export interface PatientRepository {
  list(): Promise<Patient[]>;
  /** Throws RepositoryError('validation'). */
  create(input: PatientInput): Promise<Patient>;
  update(id: string, input: PatientInput): Promise<Patient>;
  /**
   * Blocked ('in_use') while the patient has upcoming appointments. Otherwise the patient and
   * their past appointments are removed; the removed appointment ids are returned.
   */
  remove(id: string): Promise<{ patient: Patient; removedAppointmentIds: string[] }>;
}

export interface ServiceInput {
  name: Bilingual;
  specialtyKey: SpecialtyKey;
  durationMin: number;
  priceEgp: number;
}

export interface ServiceRepository {
  list(): Promise<Service[]>;
  create(input: ServiceInput): Promise<Service>;
  /** Duration and specialty are locked ('in_use') while upcoming appointments use the service. */
  update(id: string, input: ServiceInput): Promise<Service>;
  /** Blocked ('in_use') while upcoming appointments use the service. */
  remove(id: string): Promise<Service>;
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
 * All writes enforce the booking rules (doctor / patient overlap, the doctor's working hours,
 * inactive doctors) and the status flow, and throw RepositoryError
 * ('conflict', 'invalid_transition', 'not_found', 'inactive', 'validation', 'past_time',
 * 'locked_status'). Done, Cancelled and No-show appointments cannot change time, doctor, service or
 * patient ('locked_status'); No-show is only accepted once the appointment's end time has passed.
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

export interface NotificationRepository {
  /** Newest first. */
  list(): Promise<AppNotification[]>;
  add(draft: NotificationDraft): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

export interface ReportRepository {
  /**
   * The logged-in demo doctor's own report. The doctor is taken from the stored session, never from
   * an argument, so no caller can ask for another doctor's numbers. Throws RepositoryError
   * ('forbidden') when the session is not a doctor's.
   */
  myReport(range: RangeKey): Promise<DoctorReportData>;
}

export interface SessionRepository {
  get(): Session | null;
  login(role: Role): Promise<Session>;
  logout(): Promise<void>;
}

export interface PreferencesRepository {
  load(): Preferences;
  save(preferences: Preferences): void;
  /** Remembers that the demo was just reset, so the login screen can say so once. */
  flagResetNotice(): void;
  hasResetNotice(): boolean;
  clearResetNotice(): void;
}

export interface Repositories {
  doctors: DoctorRepository;
  patients: PatientRepository;
  services: ServiceRepository;
  appointments: AppointmentRepository;
  notifications: NotificationRepository;
  reports: ReportRepository;
  session: SessionRepository;
  preferences: PreferencesRepository;
}
