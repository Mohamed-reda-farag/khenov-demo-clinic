import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { SPECIALTIES, SPECIALTY_KEYS } from '@/data/specialties';
import { isRepositoryError, type ValidationIssue } from '@/data/repository/errors';
import type { Doctor, SpecialtyKey } from '@/data/types';
import { issueFor, issueText } from '@/features/appointments/issueText';
import { useFormat } from '@/i18n/useFormat';
import { atTime } from '@/lib/scheduling/time';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { useToastStore } from '@/stores/toastStore';
import { TIME_OPTIONS } from './timeOptions';
import { now } from '@/lib/clock';

function FormBody({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
  const { t } = useTranslation();
  const format = useFormat();
  const lang = usePrefsStore((state) => state.lang);
  const saveDoctor = useCatalogStore((state) => state.saveDoctor);
  const [nameAr, setNameAr] = useState(doctor.name.ar);
  const [nameEn, setNameEn] = useState(doctor.name.en);
  const [specialtyKey, setSpecialtyKey] = useState<SpecialtyKey>(doctor.specialtyKey);
  const [workStart, setWorkStart] = useState(doctor.workStart);
  const [workEnd, setWorkEnd] = useState(doctor.workEnd);
  const [active, setActive] = useState(doctor.active);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [blocked, setBlocked] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const today = now();

  const error = (field: string) => {
    const issue = issueFor(issues, field);
    return issue ? issueText(t, issue) : null;
  };
  const timeLabel = (hm: string) => format.time(atTime(today, hm));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    setBlocked(null);
    setIssues([]);
    try {
      await saveDoctor(doctor.id, {
        name: { ar: nameAr, en: nameEn },
        specialtyKey,
        workStart,
        workEnd,
        active,
      });
      useToastStore.getState().push({ tone: 'success', message: t('toast.doctorSaved') });
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
            {t('doctors.form.title')}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {t('doctors.form.description')}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <IconButton aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </Dialog.Close>
      </div>

      <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
        <Field label={t('patients.form.nameAr')} htmlFor="doctor-name-ar" error={error('name')}>
          <Input
            id="doctor-name-ar"
            dir="rtl"
            autoFocus
            value={nameAr}
            invalid={error('name') !== null}
            onChange={(e) => setNameAr(e.target.value)}
          />
        </Field>
        <Field label={t('patients.form.nameEn')} htmlFor="doctor-name-en">
          <Input
            id="doctor-name-en"
            dir="ltr"
            value={nameEn}
            invalid={error('name') !== null}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('doctors.form.specialty')} htmlFor="doctor-specialty">
            <Select
              id="doctor-specialty"
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
        <Field label={t('doctors.form.workStart')} htmlFor="doctor-start" error={error('hours')}>
          <Select
            id="doctor-start"
            value={workStart}
            onChange={(e) => setWorkStart(e.target.value)}
          >
            {TIME_OPTIONS.slice(0, -1).map((hm) => (
              <option key={hm} value={hm}>
                {timeLabel(hm)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('doctors.form.workEnd')} htmlFor="doctor-end">
          <Select id="doctor-end" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)}>
            {TIME_OPTIONS.slice(1).map((hm) => (
              <option key={hm} value={hm}>
                {timeLabel(hm)}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex min-h-11 items-start gap-3 rounded-md border border-line p-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-1 size-5 accent-primary"
          />
          <span>
            <span className="block text-sm font-semibold text-fg">{t('doctors.form.active')}</span>
            <span className="block text-sm text-muted">{t('doctors.form.activeHint')}</span>
          </span>
        </label>
        {blocked !== null && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft p-4 text-sm text-danger sm:col-span-2"
          >
            {t('doctors.form.inUse', { count: format.number(blocked) })}
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
          {t('form.submitEdit')}
        </Button>
      </div>
    </form>
  );
}

export function DoctorFormDialog({
  doctor,
  onOpenChange,
}: {
  /** The doctor being edited, or null when closed. */
  doctor: Doctor | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(doctor);
  if (doctor && doctor !== shown) setShown(doctor);

  return (
    <Dialog.Root open={doctor !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-center p-4">
          <Dialog.Content className="panel flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            {shown ? (
              <FormBody key={shown.id} doctor={shown} onClose={() => onOpenChange(false)} />
            ) : (
              <Dialog.Title className="sr-only">{t('doctors.form.title')}</Dialog.Title>
            )}
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
