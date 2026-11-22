import { create } from 'zustand';
import { repositories } from '@/data/repository';
import type { AppNotification, NotificationDraft } from '@/data/types';
import type { LoadStatus } from './catalogStore';

interface NotificationsState {
  status: LoadStatus;
  items: AppNotification[];
  load: () => Promise<void>;
  add: (draft: NotificationDraft) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  status: 'idle',
  items: [],
  load: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      set({ items: await repositories.notifications.list(), status: 'ready' });
    } catch {
      set({ status: 'error' });
    }
  },
  add: async (draft) => {
    const notification = await repositories.notifications.add(draft);
    set((state) => ({ items: [notification, ...state.items] }));
  },
  markRead: async (id) => {
    set((state) => ({ items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    await repositories.notifications.markRead(id);
  },
  markAllRead: async () => {
    set((state) => ({ items: state.items.map((n) => ({ ...n, read: true })) }));
    await repositories.notifications.markAllRead();
  },
}));
