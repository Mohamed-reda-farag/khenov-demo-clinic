import { useMemo } from 'react';
import { useCatalogStore } from '@/stores/catalogStore';

/** Id lookups for doctors, patients and services. */
export function useCatalogMaps() {
  const doctors = useCatalogStore((state) => state.doctors);
  const patients = useCatalogStore((state) => state.patients);
  const services = useCatalogStore((state) => state.services);
  return useMemo(
    () => ({
      doctorById: new Map(doctors.map((d) => [d.id, d])),
      patientById: new Map(patients.map((p) => [p.id, p])),
      serviceById: new Map(services.map((s) => [s.id, s])),
    }),
    [doctors, patients, services],
  );
}
