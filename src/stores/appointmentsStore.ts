import { create } from 'zustand';
import { repositories } from '@/data/repository';
import { RepositoryError, isRepositoryError } from '@/data/repository/errors';
import type { Appointment } from '@/data/types';
import type { LoadStatus } from './catalogStore';

export type CommitResult =
  { ok: true; saved: Appointment | null } | { ok: false; error: RepositoryError | null };

interface AppointmentsState {
  status: LoadStatus;
  items: Appointment[];
  load: () => Promise<void>;
  /** Drops appointments that were removed elsewhere (a patient deleted with their history). */
  removeMany: (ids: string[]) => void;
  /**
   * Optimistic write: shows `after` immediately, then runs the repository call.
   * On failure the previous state (`before`) is restored. Writes run one at a time, in order.
   */
  commit: (
    before: Appointment | null,
    after: Appointment | null,
    run: () => Promise<Appointment>,
  ) => Promise<CommitResult>;
}

function put(items: Appointment[], id: string, next: Appointment | null): Appointment[] {
  const rest = items.filter((item) => item.id !== id);
  return next ? [...rest, next] : rest;
}

let queue: Promise<unknown> = Promise.resolve();

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  status: 'idle',
  items: [],
  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      set({ items: await repositories.appointments.list(), status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  removeMany: (ids) => set((state) => ({ items: state.items.filter((a) => !ids.includes(a.id)) })),
  commit: async (before, after, run) => {
    const id = (after ?? before)?.id;
    if (!id) return { ok: false, error: null };
    set((state) => ({ items: put(state.items, id, after) }));

    const task = queue.then(run);
    queue = task.catch(() => undefined);
    try {
      const saved = await task;
      if (after) set((state) => ({ items: put(state.items, id, saved) }));
      return { ok: true, saved: after ? saved : null };
    } catch (error) {
      set((state) => ({ items: put(state.items, id, before) }));
      return { ok: false, error: isRepositoryError(error) ? error : null };
    }
  },
}));
