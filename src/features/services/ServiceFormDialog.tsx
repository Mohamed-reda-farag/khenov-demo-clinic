import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { SPECIALTIES, SPECIALTY_KEYS } from '@/data/specialties';
import { isRepositoryError, type ValidationIssue } from '@/data/repository/errors';
import type { Service, SpecialtyKey } from '@/data/types';
import { issueFor, issueText } from '@/features/appointments/issueText';
import { useFormat } from '@/i18n/useFormat';
import { toLatinDigits } from '@/lib/text';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { useToastStore } from '@/stores/toastStore';

const DURATIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180];

/** `service` null with `open` true adds a new service. */
interface ServiceFormDialogProps {
  open: boolean;
  service: Service | null;
  onOpenChange: (open: boolean) => void;
}

function FormBody({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const lang = usePrefsStore((state) => state.lang);
  const saveService = useCatalogStore((state) => state.saveService);
  const [nameAr, setNameAr] = useState(service?.name.ar ?? '');
  const [nameEn, setNameEn] = useState(service?.name.en ?? '');
  const [specialtyKey, setSpecialtyKey] = useState<SpecialtyKey>(
    service?.specialtyKey ?? 'internal',
  );
  const [durationMin, setDurationMin] = useState(service?.durationMin ?? 30);
  const [price, setPrice] = useState(service ? String(service.priceEgp) : '');
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [blocked, setBlocked] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const error = (field: string) => {
    const issue = issueFor(issues, field);
    return issue ? issueText(t, issue) : null;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    setBlocked(null);
    setIssues([]);
    const cleanPrice = toLatinDigits(price).trim();
    try {
      await saveService(
        {
          name: { ar: nameAr, en: nameEn },
          specialtyKey,
          durationMin,
          priceEgp: cleanPrice === '' ? Number.NaN : Number(cleanPrice),
        },
        service?.id,
      );
      useToastStore.getState().push({ tone: 'success', message: t('toast.serviceSaved') });
      onClose();
    } catch (caught) {
      if (isRepositoryError(caught) && caught.code === 'validation') setIssues(caught.issues);
      else if (isRepositoryError(caught) && caught.code === 'in_use') setBlocked(caught.count);
      else setFailed(true);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div>
          <Dialog.Title className="text-xl font-semibold text-fg">
            {service ? t('services.form.titleEdit') : t('services.form.titleNew')}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {t('services.form.description')}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <IconButton aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </Dialog.Close>
      </div>

      <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
        <Field label={t('patients.form.nameAr')} htmlFor="service-name-ar" error={error('name')}>
          <Input
            id="service-name-ar"
            dir="rtl"
            autoFocus
            value={nameAr}
            invalid={error('name') !== null}
            onChange={(e) => setNameAr(e.target.value)}
          />
        </Field>
        <Field label={t('patients.form.nameEn')} htmlFor="service-name-en">
          <Input
            id="service-name-en"
            dir="ltr"
            value={nameEn}
            invalid={error('name') !== null}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('doctors.form.specialty')} htmlFor="service-specialty">
            <Select
              id="service-specialty"
              value={specialtyKey}
              onChange={(e) => setSpecialtyKey(e.target.value as SpecialtyKey)}
            >
              {SPECIALTY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {SPECIALTIES[key][lang]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          label={t('services.columns.duration')}
          htmlFor="service-duration"
          error={error('duration')}
        >
          <Select
            id="service-duration"
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          >
            {DURATIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {format.duration(minutes)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('services.form.price')} htmlFor="service-price" error={error('price')}>
          <Input
            id="service-price"
            dir="ltr"
            inputMode="numeric"
            value={price}
            invalid={error('price') !== null}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        {blocked !== null && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft p-4 text-sm text-danger sm:col-span-2"
          >
            {t('services.form.inUse', { count: format.number(blocked) })}
          </p>
        )}
        {failed && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {t('toast.failed')}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t border-line p-6">
        <Dialog.Close asChild>
          <Button variant="secondary">{t('form.cancel')}</Button>
        </Dialog.Close>
        <Button type="submit" loading={busy}>
          {service ? t('form.submitEdit') : t('services.form.submitNew')}
        </Button>
      </div>
    </form>
  );
}

export function ServiceFormDialog({ open, service, onOpenChange }: ServiceFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-center p-4">
          <Dialog.Content className="panel flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <FormBody
              key={service?.id ?? 'new'}
              service={service}
              onClose={() => onOpenChange(false)}
            />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
