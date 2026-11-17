import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  /** Runs the newest toast's action (Undo) and removes it. Returns false if there is none. */
  runLastAction: () => boolean;
}

const MAX_TOASTS = 3;
let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const next = { ...toast, id: nextId };
    nextId += 1;
    set((state) => ({ toasts: [...state.toasts, next].slice(-MAX_TOASTS) }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  runLastAction: () => {
    const last = [...get().toasts].reverse().find((t) => t.onAction);
    if (!last) return false;
    get().dismiss(last.id);
    last.onAction?.();
    return true;
  },
}));
