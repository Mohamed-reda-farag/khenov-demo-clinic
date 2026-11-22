import { Check, Search, UserPlus } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { isRepositoryError, type ValidationIssue } from '@/data/repository/errors';
import type { Patient } from '@/data/types';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { isValidEgyptianMobile, normalizePhone } from '@/lib/phone';
import { normalizeSearch, toLatinDigits } from '@/lib/text';
import { useCatalogStore } from '@/stores/catalogStore';

const MAX_RESULTS = 5;

interface PatientPickerProps {
  patients: Patient[];
  value: string | null;
  onSelect: (patientId: string) => void;
  onClear: () => void;
}

function QuickAdd({
  initialQuery,
  onDone,
  onCancel,
}: {
  initialQuery: string;
  onDone: (patientId: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const savePatient = useCatalogStore((state) => state.savePatient);
  const digits = normalizePhone(initialQuery);
  const looksLikePhone =
    digits.length >= 3 && digits.length === toLatinDigits(initialQuery).trim().length;
  const [name, setName] = useState(looksLikePhone ? '' : initialQuery.trim());
  const [phone, setPhone] = useState(looksLikePhone ? digits : '');
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const issueText = (field: string) => {
    const issue = issues.find((i) => i.field === field);
    if (!issue) return null;
    if (field === 'name') return t('form.nameRequired');
    return issue.reason === 'duplicate' ? t('form.phoneDuplicate') : t('form.phoneInvalid');
  };

  const save = async () => {
    const found: ValidationIssue[] = [];
    if (name.trim().length < 2) found.push({ field: 'name', reason: 'required' });
    if (!isValidEgyptianMobile(phone)) found.push({ field: 'phone', reason: 'invalid' });
    setIssues(found);
    if (found.length > 0) return;

    setBusy(true);
    setFailed(false);
    try {
      const patient = await savePatient({
        name: { ar: name.trim(), en: name.trim() },
        phone,
        age: null,
      });
      onDone(patient.id);
    } catch (error) {
      if (isRepositoryError(error) && error.code === 'validation') setIssues(error.issues);
      else setFailed(true);
      setBusy(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-canvas p-4">
      <Field label={t('form.quickAddName')} htmlFor="quick-name" error={issueText('name')}>
        <Input
          id="quick-name"
          autoFocus
          value={name}
          invalid={issueText('name') !== null}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </Field>
      <Field label={t('form.quickAddPhone')} htmlFor="quick-phone" error={issueText('phone')}>
        <Input
          id="quick-phone"
          dir="ltr"
          inputMode="tel"
          autoComplete="off"
          value={phone}
          invalid={issueText('phone') !== null}
          onChange={(event) => setPhone(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </Field>
      {failed && (
        <p role="alert" className="text-sm text-danger">
          {t('form.quickAddFailed')}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          {t('form.quickAddCancel')}
        </Button>
        <Button onClick={() => void save()} loading={busy}>
          {t('form.quickAddSave')}
        </Button>
      </div>
    </div>
  );
}

export function PatientPicker({ patients, value, onSelect, onClear }: PatientPickerProps) {
  const { t } = useTranslation();
  const localize = useLocalized();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [adding, setAdding] = useState(false);
  const selected = value ? patients.find((p) => p.id === value) : undefined;

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-line-strong bg-surface p-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong"
        >
          {localize(selected.name).charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{localize(selected.name)}</p>
          <p dir="ltr" className="text-start text-xs text-muted">
            {selected.phone}
          </p>
        </div>
        <Button variant="ghost" onClick={onClear}>
          {t('form.patientChange')}
        </Button>
      </div>
    );
  }

  if (adding) {
    return (
      <QuickAdd
        initialQuery={query}
        onDone={(id) => {
          setAdding(false);
          onSelect(id);
        }}
        onCancel={() => setAdding(false)}
      />
    );
  }

  const needle = normalizeSearch(query);
  const phoneNeedle = normalizePhone(query);
  const matches = patients
    .filter(
      (p) =>
        !needle ||
        normalizeSearch(`${p.name.ar} ${p.name.en}`).includes(needle) ||
        (phoneNeedle.length > 0 && p.phone.includes(phoneNeedle)),
    )
    .slice(0, MAX_RESULTS);
  const optionCount = matches.length + 1; // the last option is "add a new patient"
  const activeIndex = Math.min(active, optionCount - 1);

  const choose = (index: number) => {
    const patient = matches[index];
    if (patient) onSelect(patient.id);
    else setAdding(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + optionCount) % optionCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(activeIndex);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <Input
          id="patient-search"
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls="patient-options"
          aria-activedescendant={`patient-option-${activeIndex}`}
          autoComplete="off"
          className="ps-10"
          placeholder={t('form.patientSearch')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div
        id="patient-options"
        role="listbox"
        aria-label={t('form.patient')}
        className="overflow-hidden rounded-md border border-line bg-surface"
      >
        {matches.length === 0 && (
          <p className="px-3 py-3 text-sm text-muted">{t('form.patientNoResults')}</p>
        )}
        {matches.map((patient, index) => (
          <div
            key={patient.id}
            id={`patient-option-${index}`}
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => choose(index)}
            onMouseMove={() => setActive(index)}
            className={cn(
              'flex min-h-11 items-center justify-between gap-3 px-3 text-sm',
              index === activeIndex ? 'bg-primary-soft text-primary-strong' : 'text-fg',
            )}
          >
            <span className="truncate">{localize(patient.name)}</span>
            <span dir="ltr" className="shrink-0 text-xs text-muted">
              {patient.phone}
            </span>
          </div>
        ))}
        <div
          id={`patient-option-${matches.length}`}
          role="option"
          aria-selected={activeIndex === matches.length}
          onClick={() => choose(matches.length)}
          onMouseMove={() => setActive(matches.length)}
          className={cn(
            'flex min-h-11 items-center gap-3 border-t border-line px-3 text-sm font-semibold',
            activeIndex === matches.length
              ? 'bg-primary-soft text-primary-strong'
              : 'text-primary-strong',
          )}
        >
          {activeIndex === matches.length ? (
            <Check className="size-4 shrink-0" aria-hidden />
          ) : (
            <UserPlus className="size-4 shrink-0" aria-hidden />
          )}
          <span className="truncate">
            {query.trim() ? t('form.quickAddFor', { query: query.trim() }) : t('form.quickAdd')}
          </span>
        </div>
      </div>
    </div>
  );
}
