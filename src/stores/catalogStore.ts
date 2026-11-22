import { create } from 'zustand';
import { repositories } from '@/data/repository';
import type { DoctorInput, PatientInput, ServiceInput } from '@/data/repository/interfaces';
import type { Doctor, Patient, Service } from '@/data/types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CatalogState {
  status: LoadStatus;
  doctors: Doctor[];
  patients: Patient[];
  services: Service[];
  load: () => Promise<void>;
  /** Creates the patient, or updates it when `id` is given. */
  savePatient: (input: PatientInput, id?: string) => Promise<Patient>;
  /** Returns the ids of the past appointments that went away with the patient. */
  removePatient: (id: string) => Promise<string[]>;
  saveDoctor: (id: string, input: DoctorInput) => Promise<Doctor>;
  saveService: (input: ServiceInput, id?: string) => Promise<Service>;
  removeService: (id: string) => Promise<void>;
}

const upsert = <T extends { id: string }>(items: T[], next: T) =>
  items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next];

export const useCatalogStore = create<CatalogState>((set, get) => ({
  status: 'idle',
  doctors: [],
  patients: [],
  services: [],
  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const [doctors, patients, services] = await Promise.all([
        repositories.doctors.list(),
        repositories.patients.list(),
        repositories.services.list(),
      ]);
      set({ doctors, patients, services, status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  savePatient: async (input, id) => {
    const patient = id
      ? await repositories.patients.update(id, input)
      : await repositories.patients.create(input);
    set((state) => ({ patients: upsert(state.patients, patient) }));
    return patient;
  },
  removePatient: async (id) => {
    const { removedAppointmentIds } = await repositories.patients.remove(id);
    set((state) => ({ patients: state.patients.filter((p) => p.id !== id) }));
    return removedAppointmentIds;
  },
  saveDoctor: async (id, input) => {
    const doctor = await repositories.doctors.update(id, input);
    set((state) => ({ doctors: upsert(state.doctors, doctor) }));
    return doctor;
  },
  saveService: async (input, id) => {
    const service = id
      ? await repositories.services.update(id, input)
      : await repositories.services.create(input);
    set((state) => ({ services: upsert(state.services, service) }));
    return service;
  },
  removeService: async (id) => {
    await repositories.services.remove(id);
    set((state) => ({ services: state.services.filter((s) => s.id !== id) }));
  },
}));
