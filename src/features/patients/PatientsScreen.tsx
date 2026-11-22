import { CalendarPlus, Pencil, Plus, Search, SearchX, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input, Select } from '@/components/ui/Field';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Patient } from '@/data/types';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import {
  buildPatientRows,
  queryPatients,
  type PatientFilter,
  type PatientSort,
} from '@/lib/patients/query';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { useUiStore } from '@/stores/uiStore';
import { PatientFormDialog } from './PatientFormDialog';
import { usePatientActions } from './usePatientActions';

const SORTS: PatientSort[] = ['name', 'age', 'next', 'visits'];
const FILTERS: PatientFilter[] = ['all', 'upcoming', 'none'];

function RowAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        className="press inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg"
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function PatientsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const navigate = useNavigate();
  const now = useNow();
  const lang = usePrefsStore((state) => state.lang);
  const status = useDataStatus();
  const reload = useReloadData();
  const patients = useCatalogStore((state) => state.patients);
  const appointments = useAppointmentsStore((state) => state.items);
  const openForm = useUiStore((state) => state.openForm);
  const { remove } = usePatientActions();

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PatientSort>('name');
  const [filter, setFilter] = useState<PatientFilter>('all');
  const [editing, setEditing] = useState<Patient | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const rows = useMemo(
    () => buildPatientRows(patients, appointments, now),
    [patients, appointments, now],
  );
  const visible = useMemo(
    () => queryPatients(rows, { query, sort, filter, lang }),
    [rows, query, sort, filter, lang],
  );
  const ready = status === 'ready';

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title={t('patients.title')}
        subtitle={
          ready ? t('patients.count', { count: format.number(patients.length) }) : undefined
        }
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" aria-hidden />
            {t('patients.add')}
          </Button>
        }
      />

      {status === 'error' ? (
        <ErrorState
          title={t('patients.errorTitle')}
          description={t('patients.errorDescription')}
          onRetry={reload}
        />
      ) : (
        <section className="rounded-lg border border-line bg-surface shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
            <div className="relative min-w-60 flex-1">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
                aria-hidden
              />
              <Input
                aria-label={t('patients.searchPlaceholder')}
                placeholder={t('patients.searchPlaceholder')}
                className="ps-10"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select
              aria-label={t('patients.sort.label')}
              value={sort}
              onChange={(e) => setSort(e.target.value as PatientSort)}
              className="min-w-44"
            >
              {SORTS.map((key) => (
                <option key={key} value={key}>
                  {t('patients.sort.label')}: {t(`patients.sort.${key}`)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t('patients.filter.label')}
              value={filter}
              onChange={(e) => setFilter(e.target.value as PatientFilter)}
              className="min-w-44"
            >
              {FILTERS.map((key) => (
                <option key={key} value={key}>
                  {t(`patients.filter.${key}`)}
                </option>
              ))}
            </Select>
          </div>

          {!ready ? (
            <div className="flex flex-col gap-3 p-4" aria-busy>
              {[0, 1, 2, 3, 4, 5].map((row) => (
                <Skeleton key={row} className="h-12" />
              ))}
            </div>
          ) : patients.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('patients.emptyTitle')}
              description={t('patients.emptyDescription')}
              action={<Button onClick={openNew}>{t('patients.add')}</Button>}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t('patients.noResultsTitle')}
              description={t('patients.noResultsDescription')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-sm">
                <caption className="sr-only">{t('patients.title')}</caption>
                <thead>
                  <tr className="border-b border-line text-start text-xs text-muted">
                    {['name', 'phone', 'age', 'next', 'visits'].map((column) => (
                      <th key={column} scope="col" className="px-4 py-3 text-start font-semibold">
                        {t(`patients.columns.${column}`)}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">{t('patients.columns.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map(({ patient, next, visits }) => (
                    <tr
                      key={patient.id}
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      className="group cursor-pointer hover:bg-sunken focus-within:bg-sunken"
                    >
                      <td className="px-4 py-2">
                        <Link
                          to={`/patients/${patient.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-fg hover:underline"
                        >
                          {localize(patient.name)}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-muted">
                        <span dir="ltr">{patient.phone}</span>
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {patient.age === null ? '—' : format.number(patient.age)}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {next
                          ? `${format.dayMonth(new Date(next.start))} · ${format.time(next.start)}`
                          : t('patients.noNext')}
                      </td>
                      <td className="px-4 py-2 text-muted">{format.number(visits)}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                          <RowAction
                            label={t('patients.book')}
                            onClick={() => openForm({ mode: 'create', patientId: patient.id })}
                          >
                            <CalendarPlus className="size-4" aria-hidden />
                          </RowAction>
                          <RowAction
                            label={t('patients.edit')}
                            onClick={() => {
                              setEditing(patient);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </RowAction>
                          <RowAction
                            label={t('patients.delete')}
                            onClick={() => void remove(patient)}
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </RowAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <PatientFormDialog open={formOpen} patient={editing} onOpenChange={setFormOpen} />
    </div>
  );
}
