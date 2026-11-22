import { CalendarDays, ClipboardList, Stethoscope, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { Role } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { searchAll } from '@/lib/search';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUiStore } from '@/stores/uiStore';
import type { Command } from './useCommands';

/**
 * Global search results as palette items. Receptionists search everything; a doctor only searches
 * their own appointments. Selecting a result opens the matching screen or panel.
 */
export function useSearchItems(query: string, role: Role): Command[] {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const navigate = useNavigate();
  const now = useNow();
  const doctorId = useSessionStore((state) => state.session?.doctorId ?? null);
  const patients = useCatalogStore((state) => state.patients);
  const doctors = useCatalogStore((state) => state.doctors);
  const services = useCatalogStore((state) => state.services);
  const appointments = useAppointmentsStore((state) => state.items);
  const openDetail = useUiStore((state) => state.openDetail);

  if (!query.trim()) return [];
  const own = role === 'doctor';
  const results = searchAll(
    query,
    {
      patients: own ? [] : patients,
      doctors: own ? [] : doctors,
      services: own ? [] : services,
      appointments: own ? appointments.filter((a) => a.doctorId === doctorId) : appointments,
    },
    now,
  );

  return [
    ...results.patients.map(({ patient }) => ({
      id: `patient-${patient.id}`,
      group: 'patients' as const,
      label: localize(patient.name),
      description: patient.phone,
      keywords: '',
      icon: Users,
      run: () => navigate(`/patients/${patient.id}`),
    })),
    ...results.appointments.map(({ appointment, patient, doctor, service }) => ({
      id: `appointment-${appointment.id}`,
      group: 'appointments' as const,
      label: `${patient ? localize(patient.name) : t('common.unknownPatient')} · ${service ? localize(service.name) : t('common.deletedService')}`,
      description: `${format.dayMonth(new Date(appointment.start))} ${format.time(appointment.start)} · ${doctor ? localize(doctor.name) : ''} · ${t(`appointment.status.${appointment.status}`)}`,
      keywords: '',
      icon: CalendarDays,
      run: () => openDetail(appointment.id),
    })),
    ...results.doctors.map(({ doctor }) => ({
      id: `doctor-${doctor.id}`,
      group: 'doctors' as const,
      label: localize(doctor.name),
      description: localize(doctor.specialty),
      keywords: '',
      icon: Stethoscope,
      run: () => navigate(`/doctors/${doctor.id}`),
    })),
    ...results.services.map(({ service }) => ({
      id: `service-${service.id}`,
      group: 'services' as const,
      label: localize(service.name),
      description: `${format.duration(service.durationMin)} · ${format.currency(service.priceEgp)}`,
      keywords: '',
      icon: ClipboardList,
      run: () => navigate(`/services?edit=${service.id}`),
    })),
  ];
}
