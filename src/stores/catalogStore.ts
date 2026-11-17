import { create } from 'zustand';
import { repositories } from '@/data/repository';
import type { NewPatientInput } from '@/data/repository/interfaces';
import type { Doctor, Patient, Service } from '@/data/types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CatalogState {
  status: LoadStatus;
  doctors: Doctor[];
  patients: Patient[];
  services: Service[];
  load: () => Promise<void>;
  addPatient: (input: NewPatientInput) => Promise<Patient>;
}

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
  addPatient: async (input) => {
    const patient = await repositories.patients.create(input);
    set((state) => ({ patients: [...state.patients, patient] }));
    return patient;
  },
}));
