import { memo, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DOCTOR_DOT, STATUS_STYLES } from '@/features/appointments/statusStyles';
import type { Appointment, Doctor, Patient, Service } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { CALENDAR_START_HOUR } from '@/lib/scheduling/constants';
import { PX_PER_MIN } from './constants';

interface AppointmentBlockProps {
  appointment: Appointment;
  patient: Patient | undefined;
  doctor: Doctor | undefined;
  service: Service | undefined;
  lane: number;
  lanes: number;
  dragging: boolean;
  onOpen: (id: string) => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>, appointment: Appointment) => void;
}

export const AppointmentBlock = memo(function AppointmentBlock({
  appointment,
  patient,
  doctor,
  service,
  lane,
  lanes,
  dragging,
  onOpen,
  onDragStart,
}: AppointmentBlockProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();

  const start = new Date(appointment.start);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const top = Math.max(0, (startMin - CALENDAR_START_HOUR * 60) * PX_PER_MIN);
  const height = appointment.durationMin * PX_PER_MIN;
  const patientName = patient ? localize(patient.name) : '';
  const doctorName = doctor ? localize(doctor.name) : '';
  const serviceName = service ? localize(service.name) : '';
  const label = t('calendar.blockLabel', {
    patient: patientName,
    service: serviceName,
    doctor: doctorName,
    time: format.time(start),
    status: t(`appointment.status.${appointment.status}`),
  });

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(appointment.id);
      }}
      onPointerDown={(event) => onDragStart(event, appointment)}
      className={cn(
        'absolute z-[1] flex cursor-grab flex-col overflow-hidden rounded-md border-s-4 px-2 py-1 text-start text-xs leading-4 text-fg shadow-sm select-none hover:shadow-md',
        STATUS_STYLES[appointment.status].block,
        dragging && 'opacity-40',
        appointment.status === 'cancelled' && 'opacity-70',
      )}
      style={{
        top,
        height: height - 2,
        insetInlineStart: `calc(${(lane * 100) / lanes}% + 2px)`,
        width: `calc(${100 / lanes}% - 4px)`,
      }}
    >
      <span
        className={cn(
          'truncate font-semibold',
          appointment.status === 'cancelled' && 'line-through',
        )}
      >
        {patientName}
      </span>
      {height >= 44 && <span className="truncate text-muted">{serviceName}</span>}
      {height >= 68 && (
        <span className="mt-auto flex items-center gap-1 truncate text-muted">
          {doctor && (
            <span
              aria-hidden
              className={cn('size-2 shrink-0 rounded-full', DOCTOR_DOT[doctor.colorToken])}
            />
          )}
          <span className="truncate">{doctorName}</span>
        </span>
      )}
    </button>
  );
});
