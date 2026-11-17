import { DEFAULT_PREFERENCES } from '@/data/seed/preferences';
import type { Appointment, Doctor, Patient, Preferences, Service, Session } from '@/data/types';
import { delay } from '@/lib/demo/delay';
import { isValidEgyptianMobile, normalizePhone } from '@/lib/phone';
import { findConflicts } from '@/lib/scheduling/conflicts';
import { canTransition } from '@/lib/scheduling/status';
import { createId } from '@/lib/id';
import { demoStorage, prefsStorage } from '@/lib/demo/storage';
import { RepositoryError, type ValidationIssue } from './errors';
import type { Repositories } from './interfaces';

const readAppointments = () => demoStorage.get<Appointment[]>('appointments', []);
const writeAppointments = (items: Appointment[]) => demoStorage.set('appointments', items);
const readDoctors = () => demoStorage.get<Doctor[]>('doctors', []);
const readServices = () => demoStorage.get<Service[]>('services', []);
const readPatients = () => demoStorage.get<Patient[]>('patients', []);

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

export const localRepositories: Repositories = {
  doctors: {
    async list() {
      await delay();
      return readDoctors();
    },
    async getById(id) {
      await delay();
      return readDoctors().find((d) => d.id === id) ?? null;
    },
  },

  patients: {
    async list() {
      await delay();
      return readPatients();
    },
    async create({ name, phone }) {
      await delay();
      const patients = readPatients();
      const cleanName = name.trim();
      const cleanPhone = normalizePhone(phone);
      const issues: ValidationIssue[] = [];
      if (cleanName.length < 2) issues.push({ field: 'name', reason: 'required' });
      if (!isValidEgyptianMobile(cleanPhone)) issues.push({ field: 'phone', reason: 'invalid' });
      else if (patients.some((p) => p.phone === cleanPhone)) {
        issues.push({ field: 'phone', reason: 'duplicate' });
      }
      if (issues.length > 0) throw new RepositoryError('validation', { issues });

      const patient: Patient = {
        id: createId('pt'),
        name: { ar: cleanName, en: cleanName },
        phone: cleanPhone,
        age: null,
      };
      demoStorage.set('patients', [...patients, patient]);
      return patient;
    },
  },

  services: {
    async list() {
      await delay();
      return readServices();
    },
  },

  appointments: {
    async list() {
      await delay();
      return readAppointments().sort((x, y) => x.start.localeCompare(y.start));
    },
    async create(draft) {
      await delay();
      const service = requireService(draft.serviceId);
      requireDoctor(draft.doctorId);
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
      if (
        patch.status &&
        patch.status !== existing.status &&
        !canTransition(existing.status, patch.status)
      ) {
        throw new RepositoryError('invalid_transition');
      }
      const updated: Appointment = { ...existing, ...patch };
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
  },
};
