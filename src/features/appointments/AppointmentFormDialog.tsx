import * as Dialog from '@radix-ui/react-dialog';
import { addMinutes, format as formatDate, parse, startOfDay } from 'date-fns';
import { CalendarX2, TriangleAlert, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input, Select } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { findConflicts } from '@/lib/scheduling/conflicts';
import { generateSlots, suggestSlots } from '@/lib/scheduling/slots';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useUiStore, type AppointmentFormRequest } from '@/stores/uiStore';
import { PatientPicker } from './PatientPicker';
import { SlotPicker } from './SlotPicker';
import { useAppointmentActions } from './useAppointmentActions';
import { useConflictText } from './useConflictText';

const DATE_VALUE = 'yyyy-MM-dd';

interface FormState {
  patientId: string | null;
  doctorId: string;
  serviceId: string;
  date: Date;
  start: Date | null;
}

function initialState(request: AppointmentFormRequest): FormState {
  const { doctors, services } = useCatalogStore.getState();
  const appointments = useAppointmentsStore.getState().items;
  const serviceFor = (doctorId: string) => {
    const specialty = doctors.find((d) => d.id === doctorId)?.specialtyKey;
    return services.find((s) => s.specialtyKey === specialty)?.id ?? services[0]?.id ?? '';
  };

  if (request.mode === 'edit') {
    const existing = appointments.find((a) => a.id === request.appointmentId);
    if (existing) {
      const start = new Date(existing.start);
      return {
        patientId: existing.patientId,
        doctorId: existing.doctorId,
        serviceId: existing.serviceId,
        date: startOfDay(start),
        start,
      };
    }
  }

  const start = request.mode === 'create' ? (request.start ?? null) : null;
  let doctorId = request.mode === 'create' ? (request.doctorId ?? null) : null;
  if (!doctorId && start) {
    // No doctor given (slot clicked in the "all doctors" week view): pick the first one who is free.
    doctorId =
      doctors.find((doctor) => {
        const service = services.find((s) => s.specialtyKey === doctor.specialtyKey);
        return (
          service !== undefined &&
          findConflicts(
            { doctorId: doctor.id, patientId: null, start, durationMin: service.durationMin },
            appointments,
            doctor,
          ).length === 0
        );
      })?.id ?? null;
  }
  doctorId = doctorId ?? doctors[0]?.id ?? '';

  return {
    patientId: null,
    doctorId,
    serviceId: serviceFor(doctorId),
    date: startOfDay(start ?? new Date()),
    start,
  };
}

function FormBody({ request, onClose }: { request: AppointmentFormRequest; onClose: () => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const actions = useAppointmentActions();
  const conflictText = useConflictText();
  const doctors = useCatalogStore((state) => state.doctors);
  const patients = useCatalogStore((state) => state.patients);
  const services = useCatalogStore((state) => state.services);
  const appointments = useAppointmentsStore((state) => state.items);
  const [form, setForm] = useState(() => initialState(request));

  const editing =
    request.mode === 'edit' ? appointments.find((a) => a.id === request.appointmentId) : undefined;
  const doctor = doctors.find((d) => d.id === form.doctorId);
  const service = services.find((s) => s.id === form.serviceId);
  const doctorServices = services.filter((s) => s.specialtyKey === doctor?.specialtyKey);
  const durationMin = service?.durationMin ?? 30;

  const freeSlots = doctor
    ? generateSlots({
        date: form.date,
        doctor,
        durationMin,
        appointments,
        patientId: form.patientId,
        ignoreId: editing?.id,
      })
        .filter((slot) => slot.free)
        .map((slot) => slot.start)
    : [];

  const conflicts =
    doctor && form.start
      ? findConflicts(
          {
            doctorId: doctor.id,
            patientId: form.patientId,
            start: form.start,
            durationMin,
            ignoreId: editing?.id,
          },
          appointments,
          doctor,
        )
      : [];

  const suggestions =
    doctor && form.start && conflicts.length > 0
      ? suggestSlots({
          date: form.date,
          target: form.start,
          doctor,
          durationMin,
          appointments,
          patientId: form.patientId,
          ignoreId: editing?.id,
        })
      : [];

  const set = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }));
  const valid =
    form.patientId !== null && form.start !== null && conflicts.length === 0 && doctor && service;
  const hint = !form.patientId
    ? t('form.needPatient')
    : !form.start
      ? t('form.needTime')
      : conflicts.length > 0
        ? t('form.fixConflict')
        : null;

  const changeDoctor = (doctorId: string) => {
    const nextDoctor = doctors.find((d) => d.id === doctorId);
    const keepService =
      services.find((s) => s.id === form.serviceId)?.specialtyKey === nextDoctor?.specialtyKey;
    set({
      doctorId,
      serviceId: keepService
        ? form.serviceId
        : (services.find((s) => s.specialtyKey === nextDoctor?.specialtyKey)?.id ?? form.serviceId),
    });
  };

  const changeDate = (value: string) => {
    const date = parse(value, DATE_VALUE, new Date());
    if (Number.isNaN(date.getTime())) return;
    const keptTime = form.start ? form.start.getHours() * 60 + form.start.getMinutes() : null;
    set({ date, start: keptTime === null ? null : addMinutes(date, keptTime) });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || !form.patientId || !form.start) return;
    const values = {
      patientId: form.patientId,
      doctorId: form.doctorId,
      serviceId: form.serviceId,
      start: form.start,
    };
    onClose();
    if (editing) void actions.edit(editing, values);
    else void actions.book(values);
  };

  const isEdit = request.mode === 'edit';

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div>
          <Dialog.Title className="text-xl font-semibold text-fg">
            {isEdit ? t('form.titleEdit') : t('form.titleNew')}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {isEdit ? t('form.descriptionEdit') : t('form.descriptionNew')}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <IconButton aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </Dialog.Close>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-fg">{t('form.patient')}</span>
            <PatientPicker
              patients={patients}
              value={form.patientId}
              onSelect={(patientId) => set({ patientId })}
              onClear={() => set({ patientId: null })}
            />
          </div>
          <Field label={t('form.doctor')} htmlFor="form-doctor">
            <Select
              id="form-doctor"
              value={form.doctorId}
              onChange={(e) => changeDoctor(e.target.value)}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {localize(d.name)} · {localize(d.specialty)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('form.service')} htmlFor="form-service">
            <Select
              id="form-service"
              value={form.serviceId}
              onChange={(e) => set({ serviceId: e.target.value })}
            >
              {doctorServices.map((s) => (
                <option key={s.id} value={s.id}>
                  {localize(s.name)} · {format.duration(s.durationMin)} ·{' '}
                  {format.currency(s.priceEgp)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex flex-col gap-5">
          <Field label={t('form.date')} htmlFor="form-date">
            <Input
              id="form-date"
              type="date"
              value={formatDate(form.date, DATE_VALUE)}
              onChange={(e) => changeDate(e.target.value)}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span id="slots-label" className="text-sm font-semibold text-fg">
              {t('form.availableSlots')}
            </span>
            {freeSlots.length === 0 ? (
              <div className="rounded-md border border-dashed border-line-strong">
                <EmptyState
                  icon={CalendarX2}
                  title={t('form.noSlotsTitle')}
                  description={t('form.noSlotsDescription')}
                />
              </div>
            ) : (
              <SlotPicker
                slots={freeSlots}
                value={form.start}
                onChange={(start) => set({ start })}
                label={t('form.availableSlots')}
              />
            )}
          </div>

          {conflicts.length > 0 && doctor && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-md bg-danger-soft p-4 text-sm text-danger"
            >
              {conflicts.map((conflict) => (
                <p
                  key={`${conflict.code}-${conflict.appointmentId ?? ''}`}
                  className="flex items-start gap-2"
                >
                  <TriangleAlert className="mt-1 size-4 shrink-0" aria-hidden />
                  {conflictText(conflict, {
                    doctorId: doctor.id,
                    patientId: form.patientId,
                    day: form.date,
                  })}
                </p>
              ))}
              {suggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">{t('form.suggestions')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((slot) => (
                      <button
                        key={slot.getTime()}
                        type="button"
                        onClick={() => set({ start: slot })}
                        className="press min-h-11 rounded-md border border-danger bg-surface px-3 text-sm font-medium text-fg hover:bg-sunken"
                      >
                        {format.time(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line p-6">
        <div className="text-sm text-muted">
          {service && (
            <p>
              {t('form.summaryDuration', { duration: format.duration(service.durationMin) })} ·{' '}
              {t('form.summaryPrice', { price: format.currency(service.priceEgp) })}
            </p>
          )}
          {hint && (
            <p id="form-hint" className="mt-1">
              {hint}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Dialog.Close asChild>
            <Button variant="secondary">{t('form.cancel')}</Button>
          </Dialog.Close>
          <Button type="submit" disabled={!valid} aria-describedby={hint ? 'form-hint' : undefined}>
            {isEdit ? t('form.submitEdit') : t('form.submitNew')}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AppointmentFormDialog() {
  const { t } = useTranslation();
  const form = useUiStore((state) => state.form);
  const closeForm = useUiStore((state) => state.closeForm);
  const [shown, setShown] = useState(form);
  if (form && form !== shown) setShown(form);

  return (
    <Dialog.Root open={form !== null} onOpenChange={(open) => !open && closeForm()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-center p-4">
          <Dialog.Content className="panel flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            {shown ? (
              <FormBody request={shown} onClose={closeForm} />
            ) : (
              <Dialog.Title className="sr-only">{t('form.titleNew')}</Dialog.Title>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
