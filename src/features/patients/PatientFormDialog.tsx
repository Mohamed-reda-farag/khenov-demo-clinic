import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { IconButton } from '@/components/ui/IconButton';
import { isRepositoryError, type ValidationIssue } from '@/data/repository/errors';
import type { Patient } from '@/data/types';
import { issueFor, issueText } from '@/features/appointments/issueText';
import { useCatalogStore } from '@/stores/catalogStore';
import { useToastStore } from '@/stores/toastStore';

interface PatientFormDialogProps {
  open: boolean;
  /** Edit this patient; omit to add a new one. */
  patient?: Patient | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (patient: Patient) => void;
}

function FormBody({
  patient,
  onClose,
  onSaved,
}: {
  patient?: Patient | null;
  onClose: () => void;
  onSaved?: (p: Patient) => void;
}) {
  const { t } = useTranslation();
  const savePatient = useCatalogStore((state) => state.savePatient);
  const [nameAr, setNameAr] = useState(patient?.name.ar ?? '');
  const [nameEn, setNameEn] = useState(patient?.name.en ?? '');
  const [phone, setPhone] = useState(patient?.phone ?? '');
  const [age, setAge] = useState(
    patient?.age === null || patient?.age === undefined ? '' : String(patient.age),
  );
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
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
    try {
      const saved = await savePatient(
        {
          name: { ar: nameAr, en: nameEn },
          phone,
          age: age.trim() === '' ? null : Number(age),
        },
        patient?.id,
      );
      useToastStore.getState().push({ tone: 'success', message: t('toast.patientSaved') });
      onSaved?.(saved);
      onClose();
    } catch (caught) {
      if (isRepositoryError(caught) && caught.code === 'validation') setIssues(caught.issues);
      else setFailed(true);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-line p-6">
        <div>
          <Dialog.Title className="text-xl font-semibold text-fg">
            {patient ? t('patients.form.titleEdit') : t('patients.form.titleNew')}
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            {t('patients.form.description')}
          </Dialog.Description>
        </div>
        <Dialog.Close asChild>
          <IconButton aria-label={t('common.close')}>
            <X className="size-5" aria-hidden />
          </IconButton>
        </Dialog.Close>
      </div>

      <div className="grid gap-5 overflow-y-auto p-6 sm:grid-cols-2">
        <Field label={t('patients.form.nameAr')} htmlFor="patient-name-ar" error={error('name')}>
          <Input
            id="patient-name-ar"
            dir="rtl"
            autoFocus
            value={nameAr}
            invalid={error('name') !== null}
            onChange={(e) => setNameAr(e.target.value)}
          />
        </Field>
        <Field label={t('patients.form.nameEn')} htmlFor="patient-name-en">
          <Input
            id="patient-name-en"
            dir="ltr"
            value={nameEn}
            invalid={error('name') !== null}
            onChange={(e) => setNameEn(e.target.value)}
          />
        </Field>
        <Field label={t('patients.form.phone')} htmlFor="patient-phone" error={error('phone')}>
          <Input
            id="patient-phone"
            dir="ltr"
            inputMode="tel"
            autoComplete="off"
            value={phone}
            invalid={error('phone') !== null}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label={t('patients.form.age')} htmlFor="patient-age" error={error('age')}>
          <Input
            id="patient-age"
            dir="ltr"
            inputMode="numeric"
            placeholder={t('patients.form.ageHint')}
            value={age}
            invalid={error('age') !== null}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
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
          {patient ? t('patients.form.submitEdit') : t('patients.form.submitNew')}
        </Button>
      </div>
    </form>
  );
}

export function PatientFormDialog({
  open,
  patient,
  onOpenChange,
  onSaved,
}: PatientFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay grid place-items-center p-4">
          <Dialog.Content className="panel flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-lg">
            <FormBody patient={patient} onClose={() => onOpenChange(false)} onSaved={onSaved} />
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
