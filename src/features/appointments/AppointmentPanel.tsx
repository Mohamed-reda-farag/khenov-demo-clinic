import * as Dialog from '@radix-ui/react-dialog';
import { CalendarX2, Check, Pencil, Trash2, X } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/ui/confirm';
import { Field, Input } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AppointmentStatus } from '@/data/types';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { endOf } from '@/lib/scheduling/time';
import { STATUS_FLOW, forwardStatus, nextStatuses } from '@/lib/scheduling/status';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useUiStore } from '@/stores/uiStore';
import { StatusBadge } from './StatusBadge';
import { DOCTOR_DOT, STATUS_STYLES } from './statusStyles';
import { useAppointmentActions } from './useAppointmentActions';
import { useCatalogMaps } from './useCatalogMaps';

function Stepper({ status }: { status: AppointmentStatus }) {
  const { t } = useTranslation();
  const current = STATUS_FLOW.indexOf(status);

  return (
    <ol aria-label={t('appointment.panel.flow')} className="flex items-start">
      {STATUS_FLOW.map((step, index) => {
        const reached = index <= current;
        return (
          <li
            key={step}
            aria-current={index === current ? 'step' : undefined}
            className="flex flex-1 flex-col items-center gap-2 text-center"
          >
            <div className="flex w-full items-center">
              <span
                className={cn(
                  'h-0.5 flex-1',
                  index === 0 ? 'bg-transparent' : reached ? 'bg-primary' : 'bg-line',
                )}
              />
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  reached ? STATUS_STYLES[step].step : 'border-line-strong bg-surface text-subtle',
                )}
              >
                {index < current ? <Check className="size-4" aria-hidden /> : null}
              </span>
              <span
                className={cn(
                  'h-0.5 flex-1',
                  index === STATUS_FLOW.length - 1
                    ? 'bg-transparent'
                    : index < current
                      ? 'bg-primary'
                      : 'bg-line',
                )}
              />
            </div>
            <span
              className={cn('text-xs', index === current ? 'font-semibold text-fg' : 'text-muted')}
            >
              {t(`appointment.status.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-end text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

function PanelBody({ appointmentId }: { appointmentId: string }) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const confirm = useConfirm();
  const actions = useAppointmentActions();
  const { doctorById, patientById, serviceById } = useCatalogMaps();
  const appointment = useAppointmentsStore((state) =>
    state.items.find((a) => a.id === appointmentId),
  );
  const closeDetail = useUiStore((state) => state.closeDetail);
  const openForm = useUiStore((state) => state.openForm);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');

  const header = (title: string, description: string) => (
    <div className="flex items-start justify-between gap-4 border-b border-line p-6">
      <div className="min-w-0">
        <Dialog.Title className="truncate text-xl font-semibold text-fg">{title}</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
      </div>
      <Dialog.Close asChild>
        <IconButton aria-label={t('common.close')}>
          <X className="size-5" aria-hidden />
        </IconButton>
      </Dialog.Close>
    </div>
  );

  if (!appointment) {
    return (
      <>
        {header(t('appointment.panel.missingTitle'), t('appointment.panel.missingDescription'))}
        <EmptyState
          icon={CalendarX2}
          title={t('appointment.panel.missingTitle')}
          description={t('appointment.panel.missingDescription')}
        />
      </>
    );
  }

  const patient = patientById.get(appointment.patientId);
  const doctor = doctorById.get(appointment.doctorId);
  const service = serviceById.get(appointment.serviceId);
  const start = new Date(appointment.start);
  const forward = forwardStatus(appointment.status);
  const canCancel = nextStatuses(appointment.status).includes('cancelled');
  const editable = canCancel;
  const patientName = patient ? localize(patient.name) : '';

  const submitCancel = (event: FormEvent) => {
    event.preventDefault();
    void actions.changeStatus(appointment, 'cancelled', reason);
    setCancelling(false);
    setReason('');
  };

  const remove = async () => {
    const accepted = await confirm({
      title: t('appointment.delete.title'),
      description: t('appointment.delete.description', {
        patient: patientName,
        time: format.time(start),
      }),
      confirmLabel: t('appointment.delete.confirm'),
      tone: 'danger',
    });
    if (!accepted) return;
    closeDetail();
    void actions.remove(appointment);
  };

  return (
    <>
      {header(patientName, service ? localize(service.name) : '')}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        {appointment.status === 'cancelled' ? (
          <div className="flex flex-col gap-2">
            <StatusBadge status="cancelled" className="self-start" />
            {appointment.cancelReason && (
              <p className="text-sm text-muted">
                {t('appointment.panel.cancelledReason', { reason: appointment.cancelReason })}
              </p>
            )}
          </div>
        ) : (
          <Stepper status={appointment.status} />
        )}

        <dl className="divide-y divide-line rounded-lg border border-line px-4">
          <Detail label={t('appointment.panel.when')}>
            <span className="block">{format.date(start)}</span>
            <span className="block text-muted">
              {format.time(start)} – {format.time(endOf(start, appointment.durationMin))}
            </span>
          </Detail>
          <Detail label={t('appointment.panel.duration')}>
            {format.duration(appointment.durationMin)}
          </Detail>
          <Detail label={t('appointment.panel.doctor')}>
            {doctor && (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn('size-2 rounded-full', DOCTOR_DOT[doctor.colorToken])}
                />
                {localize(doctor.name)}
              </span>
            )}
          </Detail>
          <Detail label={t('appointment.panel.price')}>
            {service ? format.currency(service.priceEgp) : ''}
          </Detail>
          <Detail label={t('appointment.panel.phone')}>
            <span dir="ltr">{patient?.phone}</span>
          </Detail>
        </dl>

        <div className="flex flex-col gap-3">
          {forward && !cancelling && (
            <Button onClick={() => void actions.changeStatus(appointment, forward)}>
              {t(`appointment.actions.${forward}`)}
            </Button>
          )}
          {!forward && !canCancel && (
            <p className="text-sm text-muted">{t('appointment.panel.finished')}</p>
          )}
          {canCancel && !cancelling && (
            <Button variant="secondary" onClick={() => setCancelling(true)}>
              {t('appointment.actions.cancel')}
            </Button>
          )}
          {cancelling && (
            <form
              onSubmit={submitCancel}
              className="flex flex-col gap-3 rounded-lg border border-line bg-canvas p-4"
            >
              <Field label={t('appointment.cancel.reasonLabel')} htmlFor="cancel-reason">
                <Input
                  id="cancel-reason"
                  autoFocus
                  value={reason}
                  placeholder={t('appointment.cancel.reasonPlaceholder')}
                  onChange={(event) => setReason(event.target.value)}
                />
              </Field>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={() => setCancelling(false)}>
                  {t('appointment.cancel.back')}
                </Button>
                <Button type="submit" variant="danger">
                  {t('appointment.cancel.confirm')}
                </Button>
              </div>
            </form>
          )}
          {editable && (
            <Button
              variant="secondary"
              onClick={() => openForm({ mode: 'edit', appointmentId: appointment.id })}
            >
              <Pencil className="size-4" aria-hidden />
              {t('appointment.actions.edit')}
            </Button>
          )}
        </div>
      </div>
      <div className="border-t border-line p-4">
        <Button
          variant="ghost"
          className="text-danger hover:text-danger"
          onClick={() => void remove()}
        >
          <Trash2 className="size-4" aria-hidden />
          {t('appointment.actions.delete')}
        </Button>
      </div>
    </>
  );
}

export function AppointmentPanel() {
  const { t } = useTranslation();
  const detailId = useUiStore((state) => state.detailId);
  const closeDetail = useUiStore((state) => state.closeDetail);
  const [shownId, setShownId] = useState(detailId);
  if (detailId && detailId !== shownId) setShownId(detailId);

  return (
    <Dialog.Root open={detailId !== null} onOpenChange={(open) => !open && closeDetail()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay flex justify-end">
          <Dialog.Content className="sheet flex h-full w-full max-w-md flex-col border-s border-line bg-surface shadow-lg">
            {shownId ? (
              <PanelBody key={shownId} appointmentId={shownId} />
            ) : (
              <Dialog.Title className="sr-only">{t('calendar.title')}</Dialog.Title>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
