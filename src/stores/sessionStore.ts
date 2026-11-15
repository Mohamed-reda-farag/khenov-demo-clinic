import { create } from 'zustand';
import { repositories } from '@/data/repository';
import type { Role, Session } from '@/data/types';

interface SessionState {
  session: Session | null;
  login: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: repositories.session.get(),
  login: async (role) => {
    set({ session: await repositories.session.login(role) });
  },
  logout: async () => {
    await repositories.session.logout();
    set({ session: null });
  },
}));
