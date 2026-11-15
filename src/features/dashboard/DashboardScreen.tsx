import { CalendarCheck, Stethoscope, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { endOfDay, startOfDay } from 'date-fns';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { repositories } from '@/data/repository';
import { useFormat } from '@/i18n/useFormat';
import { useAsync } from '@/lib/useAsync';

interface Overview {
  doctors: number;
  patients: number;
  appointmentsToday: number;
}

async function loadOverview(): Promise<Overview> {
  const now = new Date();
  const [doctors, patients, today] = await Promise.all([
    repositories.doctors.list(),
    repositories.patients.list(),
    repositories.appointments.listByRange(startOfDay(now), endOfDay(now)),
  ]);
  return { doctors: doctors.length, patients: patients.length, appointmentsToday: today.length };
}

function StatCard({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  index: number;
}) {
  return (
    <div
      className="anim-rise-in flex items-center gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="text-sm text-muted">{label}</p>
        {value === null ? (
          <Skeleton className="mt-1 h-8 w-16" />
        ) : (
          <p className="text-2xl font-semibold text-fg">{value}</p>
        )}
      </div>
    </div>
  );
}

export function DashboardScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const state = useAsync(loadOverview);
  const data = state.status === 'success' ? state.data : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader title={t('dashboard.title')} subtitle={format.date(new Date())} />
      {state.status === 'error' ? (
        <ErrorState
          title={t('dashboard.errorTitle')}
          description={t('dashboard.errorDescription')}
          onRetry={state.reload}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            index={0}
            icon={CalendarCheck}
            label={t('dashboard.stats.appointmentsToday')}
            value={data ? format.number(data.appointmentsToday) : null}
          />
          <StatCard
            index={1}
            icon={Users}
            label={t('dashboard.stats.patients')}
            value={data ? format.number(data.patients) : null}
          />
          <StatCard
            index={2}
            icon={Stethoscope}
            label={t('dashboard.stats.doctors')}
            value={data ? format.number(data.doctors) : null}
          />
        </div>
      )}
    </div>
  );
}
