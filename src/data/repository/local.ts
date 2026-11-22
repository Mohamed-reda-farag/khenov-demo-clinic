import { SPECIALTIES, SPECIALTY_KEYS } from '@/data/specialties';
import { DEFAULT_PREFERENCES } from '@/data/seed/preferences';
import type {
  AppNotification,
  Appointment,
  Bilingual,
  Doctor,
  Patient,
  Preferences,
  Service,
  Session,
} from '@/data/types';
import { ERROR_MODE } from '@/lib/demo/config';
import { delay } from '@/lib/demo/delay';
import { demoStorage, prefsStorage } from '@/lib/demo/storage';
import { now } from '@/lib/clock';
import { createId } from '@/lib/id';
import { isValidEgyptianMobile, normalizePhone } from '@/lib/phone';
import { findConflicts } from '@/lib/scheduling/conflicts';
import { buildDoctorReport, resolveRange } from '@/lib/reports/aggregate';
import { isPastStart } from '@/lib/scheduling/past';
import { hoursViolations, isUpcoming, isValidWorkingHours } from '@/lib/scheduling/rules';
import { canTransitionAt, isLockedStatus } from '@/lib/scheduling/status';
import { RepositoryError, type ValidationIssue } from './errors';
import type { AppointmentPatch, Repositories } from './interfaces';

const VISIT_NOTE_MAX = 200;

/** `?demo=error`: the first load of each list fails once, so the error state and its Retry can be shown. */
const failedOnce = new Set<string>();
function failFirstLoad(collection: string): void {
  if (!ERROR_MODE || failedOnce.has(collection)) return;
  failedOnce.add(collection);
  throw new Error(`demo error: ${collection}`);
}

/** Booking or moving an appointment into the past is never allowed. */
function assertNotPast(startIso: string): void {
  if (isPastStart(new Date(startIso), now())) throw new RepositoryError('past_time');
}

/** True when the patch would change the time, the doctor, the service or the patient. */
function changesWhoOrWhen(existing: Appointment, patch: AppointmentPatch): boolean {
  return (['start', 'doctorId', 'serviceId', 'patientId'] as const).some(
    (key) => patch[key] !== undefined && patch[key] !== existing[key],
  );
}

const readAppointments = () => demoStorage.get<Appointment[]>('appointments', []);
const writeAppointments = (items: Appointment[]) => demoStorage.set('appointments', items);
const readDoctors = () => demoStorage.get<Doctor[]>('doctors', []);
const readServices = () => demoStorage.get<Service[]>('services', []);
const readPatients = () => demoStorage.get<Patient[]>('patients', []);
const readNotifications = () => demoStorage.get<AppNotification[]>('notifications', []);

function requireDoctor(id: string): Doctor {
  const doctor = readDoctors().find((d) => d.id === id);
  if (!doctor) throw new RepositoryError('not_found');
  return doctor;
}

function requireService(id: string): Service {
  const service = readServices().find((s) => s.id === id);
  if (!service) throw new RepositoryError('not_found');
  return service;
}

function assertNoConflicts(appointment: Appointment, all: Appointment[]): void {
  if (appointment.status === 'cancelled') return;
  const conflicts = findConflicts(
    {
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      start: new Date(appointment.start),
      durationMin: appointment.durationMin,
      ignoreId: appointment.id,
    },
    all,
    requireDoctor(appointment.doctorId),
  );
  if (conflicts.length > 0) throw new RepositoryError('conflict', { conflicts });
}

function validateBilingual(name: Bilingual, issues: ValidationIssue[]): void {
  if (name.ar.trim().length < 2 || name.en.trim().length < 2) {
    issues.push({ field: 'name', reason: 'required' });
  }
}

function trimmed(name: Bilingual): Bilingual {
  return { ar: name.ar.trim(), en: name.en.trim() };
}

function throwIfIssues(issues: ValidationIssue[]): void {
  if (issues.length > 0) throw new RepositoryError('validation', { issues });
}

export const localRepositories: Repositories = {
  doctors: {
    async list() {
      await delay();
      failFirstLoad('doctors');
      return readDoctors();
    },
    async getById(id) {
      await delay();
      return readDoctors().find((d) => d.id === id) ?? null;
    },
    async update(id, input) {
      await delay();
      const existing = requireDoctor(id);
      const issues: ValidationIssue[] = [];
      validateBilingual(input.name, issues);
      if (!SPECIALTY_KEYS.includes(input.specialtyKey))
        issues.push({ field: 'specialty', reason: 'invalid' });
      if (!isValidWorkingHours(input.workStart, input.workEnd))
        issues.push({ field: 'hours', reason: 'range' });
      throwIfIssues(issues);

      const current = now();
      const appointments = readAppointments();
      const outside = hoursViolations(appointments, id, input.workStart, input.workEnd, current);
      if (outside.length > 0) throw new RepositoryError('in_use', { count: outside.length });
      if (input.specialtyKey !== existing.specialtyKey) {
        const services = readServices();
        const mismatched = appointments.filter(
          (a) =>
            a.doctorId === id &&
            isUpcoming(a, current) &&
            services.find((s) => s.id === a.serviceId)?.specialtyKey !== input.specialtyKey,
        );
        if (mismatched.length > 0)
          throw new RepositoryError('in_use', { count: mismatched.length });
      }

      const updated: Doctor = {
        ...existing,
        name: trimmed(input.name),
        specialtyKey: input.specialtyKey,
        specialty: SPECIALTIES[input.specialtyKey],
        workStart: input.workStart,
        workEnd: input.workEnd,
        active: input.active,
      };
      demoStorage.set(
        'doctors',
        readDoctors().map((d) => (d.id === id ? updated : d)),
      );
      return updated;
    },
  },

  patients: {
    async list() {
      await delay();
      failFirstLoad('patients');
      return readPatients();
    },
    async create(input) {
      await delay();
      const patients = readPatients();
      const patient = { id: createId('pt'), ...validatePatient(input, patients, null) };
      demoStorage.set('patients', [...patients, patient]);
      return patient;
    },
    async update(id, input) {
      await delay();
      const patients = readPatients();
      if (!patients.some((p) => p.id === id)) throw new RepositoryError('not_found');
      const updated = { id, ...validatePatient(input, patients, id) };
      demoStorage.set(
        'patients',
        patients.map((p) => (p.id === id ? updated : p)),
      );
      return updated;
    },
    async remove(id) {
      await delay();
      const patient = readPatients().find((p) => p.id === id);
      if (!patient) throw new RepositoryError('not_found');
      const mine = readAppointments().filter((a) => a.patientId === id);
      const upcoming = mine.filter((a) => isUpcoming(a, now()));
      if (upcoming.length > 0) throw new RepositoryError('in_use', { count: upcoming.length });

      const removedAppointmentIds = mine.map((a) => a.id);
      writeAppointments(readAppointments().filter((a) => a.patientId !== id));
      demoStorage.set(
        'patients',
        readPatients().filter((p) => p.id !== id),
      );
      return { patient, removedAppointmentIds };
    },
  },

  services: {
    async list() {
      await delay();
      failFirstLoad('services');
      return readServices();
    },
    async create(input) {
      await delay();
      const service = { id: createId('sv'), ...validateService(input) };
      demoStorage.set('services', [...readServices(), service]);
      return service;
    },
    async update(id, input) {
      await delay();
      const existing = requireService(id);
      const next = validateService(input);
      const locked =
        next.durationMin !== existing.durationMin || next.specialtyKey !== existing.specialtyKey;
      if (locked) {
        const upcoming = readAppointments().filter(
          (a) => a.serviceId === id && isUpcoming(a, now()),
        );
        if (upcoming.length > 0) throw new RepositoryError('in_use', { count: upcoming.length });
      }
      const updated = { id, ...next };
      demoStorage.set(
        'services',
        readServices().map((s) => (s.id === id ? updated : s)),
      );
      return updated;
    },
    async remove(id) {
      await delay();
      const service = requireService(id);
      const upcoming = readAppointments().filter((a) => a.serviceId === id && isUpcoming(a, now()));
      if (upcoming.length > 0) throw new RepositoryError('in_use', { count: upcoming.length });
      demoStorage.set(
        'services',
        readServices().filter((s) => s.id !== id),
      );
      return service;
    },
  },

  appointments: {
    async list() {
      await delay();
      failFirstLoad('appointments');
      return readAppointments().sort((x, y) => x.start.localeCompare(y.start));
    },
    async create(draft) {
      await delay();
      const service = requireService(draft.serviceId);
      if (!requireDoctor(draft.doctorId).active) throw new RepositoryError('inactive');
      assertNotPast(draft.start);
      if (!readPatients().some((p) => p.id === draft.patientId))
        throw new RepositoryError('not_found');
      const appointment: Appointment = {
        ...draft,
        durationMin: service.durationMin,
        status: 'pending',
        visitNote: null,
        cancelReason: null,
      };
      const all = readAppointments();
      assertNoConflicts(appointment, all);
      writeAppointments([...all, appointment]);
      return appointment;
    },
    async update(id, patch) {
      await delay();
      const all = readAppointments();
      const existing = all.find((a) => a.id === id);
      if (!existing) throw new RepositoryError('not_found');
      // Done, Cancelled and No-show are final: no moving, rescheduling or editing, past or future.
      if (isLockedStatus(existing.status) && changesWhoOrWhen(existing, patch)) {
        throw new RepositoryError('locked_status');
      }
      if (
        patch.status &&
        patch.status !== existing.status &&
        !canTransitionAt(existing, patch.status, now())
      ) {
        throw new RepositoryError('invalid_transition');
      }
      if (patch.visitNote && patch.visitNote.length > VISIT_NOTE_MAX) {
        throw new RepositoryError('validation', {
          issues: [{ field: 'visitNote', reason: 'too_long' }],
        });
      }
      if (
        patch.doctorId &&
        patch.doctorId !== existing.doctorId &&
        !requireDoctor(patch.doctorId).active
      ) {
        throw new RepositoryError('inactive');
      }
      const updated: Appointment = { ...existing, ...patch };
      // Status, note and service changes keep the time; only a real move is checked.
      if (updated.start !== existing.start || updated.doctorId !== existing.doctorId)
        assertNotPast(updated.start);
      if (patch.serviceId) updated.durationMin = requireService(patch.serviceId).durationMin;
      assertNoConflicts(updated, all);
      writeAppointments(all.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    async remove(id) {
      await delay();
      const all = readAppointments();
      const existing = all.find((a) => a.id === id);
      if (!existing) throw new RepositoryError('not_found');
      writeAppointments(all.filter((a) => a.id !== id));
      return existing;
    },
    async restore(snapshot) {
      await delay();
      const all = readAppointments();
      assertNoConflicts(snapshot, all);
      const exists = all.some((a) => a.id === snapshot.id);
      writeAppointments(
        exists ? all.map((a) => (a.id === snapshot.id ? snapshot : a)) : [...all, snapshot],
      );
      return snapshot;
    },
  },

  notifications: {
    async list() {
      await delay();
      failFirstLoad('notifications');
      return readNotifications().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async add(draft) {
      const notification: AppNotification = {
        ...draft,
        id: createId('nt'),
        createdAt: now().toISOString(),
        read: false,
      };
      demoStorage.set('notifications', [notification, ...readNotifications()]);
      return notification;
    },
    async markRead(id) {
      demoStorage.set(
        'notifications',
        readNotifications().map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    async markAllRead() {
      demoStorage.set(
        'notifications',
        readNotifications().map((n) => ({ ...n, read: true })),
      );
    },
  },

  reports: {
    async myReport(range) {
      await delay();
      failFirstLoad('myReport');
      const session = demoStorage.get<Session | null>('session', null);
      if (session?.role !== 'doctor' || !session.doctorId) throw new RepositoryError('forbidden');
      // Scoped here, from the session: only this doctor's appointments are ever read for the report.
      const mine = readAppointments().filter((a) => a.doctorId === session.doctorId);
      return buildDoctorReport(mine, resolveRange(range, now()), session.doctorId);
    },
  },

  session: {
    get() {
      return demoStorage.get<Session | null>('session', null);
    },
    async login(role) {
      await delay();
      const firstDoctor = readDoctors()[0];
      const session: Session = {
        role,
        doctorId: role === 'doctor' ? (firstDoctor?.id ?? null) : null,
      };
      demoStorage.set('session', session);
      return session;
    },
    async logout() {
      demoStorage.remove('session');
    },
  },

  preferences: {
    load() {
      const stored = prefsStorage.get<Partial<Preferences>>('prefs', {});
      return {
        lang: stored.lang === 'en' ? 'en' : DEFAULT_PREFERENCES.lang,
        theme: stored.theme === 'dark' ? 'dark' : DEFAULT_PREFERENCES.theme,
        sidebarCollapsed: stored.sidebarCollapsed === true,
        sidebarWidth:
          typeof stored.sidebarWidth === 'number'
            ? stored.sidebarWidth
            : DEFAULT_PREFERENCES.sidebarWidth,
      };
    },
    save(preferences) {
      prefsStorage.set('prefs', preferences);
    },
    flagResetNotice() {
      prefsStorage.set('reset-notice', true);
    },
    hasResetNotice() {
      return prefsStorage.get<boolean>('reset-notice', false);
    },
    clearResetNotice() {
      prefsStorage.remove('reset-notice');
    },
  },
};

function validatePatient(
  input: { name: Bilingual; phone: string; age: number | null },
  patients: Patient[],
  ignoreId: string | null,
): Omit<Patient, 'id'> {
  const issues: ValidationIssue[] = [];
  validateBilingual(input.name, issues);
  const phone = normalizePhone(input.phone);
  if (!isValidEgyptianMobile(phone)) issues.push({ field: 'phone', reason: 'invalid' });
  else if (patients.some((p) => p.phone === phone && p.id !== ignoreId)) {
    issues.push({ field: 'phone', reason: 'duplicate' });
  }
  if (input.age !== null && (!Number.isInteger(input.age) || input.age < 0 || input.age > 120)) {
    issues.push({ field: 'age', reason: 'range' });
  }
  throwIfIssues(issues);
  return { name: trimmed(input.name), phone, age: input.age };
}

function validateService(input: {
  name: Bilingual;
  specialtyKey: Service['specialtyKey'];
  durationMin: number;
  priceEgp: number;
}): Omit<Service, 'id'> {
  const issues: ValidationIssue[] = [];
  validateBilingual(input.name, issues);
  if (!SPECIALTY_KEYS.includes(input.specialtyKey))
    issues.push({ field: 'specialty', reason: 'invalid' });
  const { durationMin, priceEgp } = input;
  if (
    !Number.isInteger(durationMin) ||
    durationMin < 15 ||
    durationMin > 180 ||
    durationMin % 15 !== 0
  ) {
    issues.push({ field: 'duration', reason: 'range' });
  }
  if (!Number.isInteger(priceEgp) || priceEgp < 0 || priceEgp > 100_000) {
    issues.push({ field: 'price', reason: 'range' });
  }
  throwIfIssues(issues);
  return { name: trimmed(input.name), specialtyKey: input.specialtyKey, durationMin, priceEgp };
}
