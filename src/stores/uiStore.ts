import { create } from 'zustand';

export type AppointmentFormRequest =
  | { mode: 'create'; start?: Date; doctorId?: string | null }
  | { mode: 'edit'; appointmentId: string };

interface UiState {
  detailId: string | null;
  form: AppointmentFormRequest | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  openForm: (request: AppointmentFormRequest) => void;
  closeForm: () => void;
}

/** Which appointment dialogs are open. Any screen can open them. */
export const useUiStore = create<UiState>((set) => ({
  detailId: null,
  form: null,
  openDetail: (id) => set({ detailId: id }),
  closeDetail: () => set({ detailId: null }),
  openForm: (request) => set({ form: request }),
  closeForm: () => set({ form: null }),
}));
