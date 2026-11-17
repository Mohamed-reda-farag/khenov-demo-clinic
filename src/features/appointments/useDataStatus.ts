import { useCallback } from 'react';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';

export type DataStatus = 'loading' | 'ready' | 'error';

/** Combined load state of the catalog (doctors, patients, services) and the appointments. */
export function useDataStatus(): DataStatus {
  const catalog = useCatalogStore((state) => state.status);
  const appointments = useAppointmentsStore((state) => state.status);
  if (catalog === 'error' || appointments === 'error') return 'error';
  return catalog === 'ready' && appointments === 'ready' ? 'ready' : 'loading';
}

export function useReloadData(): () => void {
  return useCallback(() => {
    void useCatalogStore.getState().load();
    void useAppointmentsStore.getState().load();
  }, []);
}
