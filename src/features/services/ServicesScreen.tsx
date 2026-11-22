import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { SPECIALTIES, SPECIALTY_KEYS } from '@/data/specialties';
import type { Service } from '@/data/types';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { ServiceFormDialog } from './ServiceFormDialog';
import { useServiceActions } from './useServiceActions';

export function ServicesScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const lang = usePrefsStore((state) => state.lang);
  const status = useDataStatus();
  const reload = useReloadData();
  const services = useCatalogStore((state) => state.services);
  const { remove } = useServiceActions();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // `?edit=<service id>` (from global search) opens that service's editor.
  const requestedId = params.get('edit');
  const activeId = editingId ?? requestedId;
  const editing = services.find((s) => s.id === activeId) ?? null;
  const open = adding || (status === 'ready' && editing !== null);

  const sorted = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          SPECIALTY_KEYS.indexOf(a.specialtyKey) - SPECIALTY_KEYS.indexOf(b.specialtyKey) ||
          a.name[lang].localeCompare(b.name[lang], lang),
      ),
    [services, lang],
  );

  const close = () => {
    setAdding(false);
    setEditingId(null);
    if (requestedId) setParams({}, { replace: true });
  };
  const ready = status === 'ready';

  const action = (label: string, onClick: () => void, icon: ReactNode) => (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="press inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-fg"
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title={t('services.title')}
        subtitle={t('services.subtitle')}
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden />
            {t('services.add')}
          </Button>
        }
      />

      {status === 'error' ? (
        <ErrorState
          title={t('services.errorTitle')}
          description={t('services.errorDescription')}
          onRetry={reload}
        />
      ) : (
        <section className="rounded-lg border border-line bg-surface shadow-sm">
          {!ready ? (
            <div className="flex flex-col gap-3 p-4" aria-busy>
              {[0, 1, 2, 3, 4].map((n) => (
                <Skeleton key={n} className="h-12" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={t('services.emptyTitle')}
              description={t('services.emptyDescription')}
              action={<Button onClick={() => setAdding(true)}>{t('services.add')}</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <caption className="sr-only">{t('services.title')}</caption>
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    {['name', 'specialty', 'duration', 'price'].map((column) => (
                      <th key={column} scope="col" className="px-4 py-3 text-start font-semibold">
                        {t(`services.columns.${column}`)}
                      </th>
                    ))}
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">{t('patients.columns.actions')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sorted.map((service: Service) => (
                    <tr key={service.id} className="group hover:bg-sunken focus-within:bg-sunken">
                      <th scope="row" className="px-4 py-2 text-start font-semibold text-fg">
                        {localize(service.name)}
                      </th>
                      <td className="px-4 py-2 text-muted">
                        {SPECIALTIES[service.specialtyKey][lang]}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {format.duration(service.durationMin)}
                      </td>
                      <td className="px-4 py-2 font-medium text-fg">
                        {format.currency(service.priceEgp)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                          {action(
                            t('services.edit'),
                            () => setEditingId(service.id),
                            <Pencil className="size-4" aria-hidden />,
                          )}
                          {action(
                            t('services.delete'),
                            () => void remove(service),
                            <Trash2 className="size-4" aria-hidden />,
                          )}
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

      <ServiceFormDialog open={open} service={editing} onOpenChange={(next) => !next && close()} />
    </div>
  );
}
