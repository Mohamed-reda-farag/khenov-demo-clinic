import { addDays, startOfDay } from 'date-fns';
import { create } from 'zustand';
import type { Doctor } from '@/data/types';
import { now } from '@/lib/clock';
import { resolveDoctorFilter, type SpecialtyFilter } from '@/lib/scheduling/filters';

export type CalendarView = 'week' | 'day';

interface CalendarState {
  anchor: Date;
  view: CalendarView;
  /** `'all'` or a specialty key. Limits the doctors (and their appointments) the calendar shows. */
  specialtyFilter: SpecialtyFilter;
  /** `'all'` or a doctor id (always inside the chosen specialty). */
  doctorFilter: string;
  setView: (view: CalendarView) => void;
  /** Changing the specialty clears a doctor selection that does not belong to it. */
  setSpecialtyFilter: (
    specialty: SpecialtyFilter,
    doctors: readonly Pick<Doctor, 'id' | 'specialtyKey'>[],
  ) => void;
  setDoctorFilter: (doctorId: string) => void;
  goToday: () => void;
  /** Moves a week (week view) or a day (day view). */
  shift: (direction: 1 | -1) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  anchor: startOfDay(now()),
  view: 'week',
  specialtyFilter: 'all',
  doctorFilter: 'all',
  setView: (view) => set({ view }),
  setSpecialtyFilter: (specialtyFilter, doctors) =>
    set((state) => ({
      specialtyFilter,
      doctorFilter: resolveDoctorFilter(doctors, specialtyFilter, state.doctorFilter),
    })),
  setDoctorFilter: (doctorFilter) => set({ doctorFilter }),
  goToday: () => set({ anchor: startOfDay(now()) }),
  shift: (direction) =>
    set((state) => ({
      anchor: addDays(state.anchor, direction * (state.view === 'week' ? 7 : 1)),
    })),
}));
