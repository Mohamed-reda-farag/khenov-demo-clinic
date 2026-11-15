import { DEFAULT_PREFERENCES } from '@/data/seed/preferences';
import type { Appointment, Doctor, Patient, Preferences, Service, Session } from '@/data/types';
import { delay } from '@/lib/demo/delay';
import { demoStorage, prefsStorage } from '@/lib/demo/storage';
import type { Repositories } from './interfaces';

export const localRepositories: Repositories = {
  doctors: {
    async list() {
      await delay();
      return demoStorage.get<Doctor[]>('doctors', []);
    },
    async getById(id) {
      await delay();
      return demoStorage.get<Doctor[]>('doctors', []).find((d) => d.id === id) ?? null;
    },
  },

  patients: {
    async list() {
      await delay();
      return demoStorage.get<Patient[]>('patients', []);
    },
  },

  services: {
    async list() {
      await delay();
      return demoStorage.get<Service[]>('services', []);
    },
  },

  appointments: {
    async listByRange(from, to) {
      await delay();
      return demoStorage
        .get<Appointment[]>('appointments', [])
        .filter((a) => {
          const start = new Date(a.start).getTime();
          return start >= from.getTime() && start <= to.getTime();
        })
        .sort((a, b) => a.start.localeCompare(b.start));
    },
  },

  session: {
    get() {
      return demoStorage.get<Session | null>('session', null);
    },
    async login(role) {
      await delay();
      const firstDoctor = demoStorage.get<Doctor[]>('doctors', [])[0];
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
