import { Ban, CalendarCheck, CalendarRange, FileBarChart, UserX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { repositories } from '@/data/repository';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { resolveRange, type DoctorReportData, type RangeKey } from '@/lib/reports/aggregate';
import { atMinutes } from '@/lib/scheduling/time';
import { useAsync } from '@/lib/useAsync';
import { useNow } from '@/lib/useNow';
import { usePrefsStore } from '@/stores/prefsStore';
import { useSessionStore } from '@/stores/sessionStore';
import { ChartCard } from './ChartCard';
import { BarChart, DonutChart, HBarChart, type DonutSlice } from './charts';
import { Kpi, STATUS_CHART, STATUS_ORDER } from './reportParts';
import { ReportsSkeleton } from './ReportsSkeleton';

const RANGES: RangeKey[] = ['7d', '30d', 'week'];
const TOP_SERVICES = 5;

function Charts({ report }: { report: DoctorReportData }) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const rtl = usePrefsStore((state) => state.lang) === 'ar';
  const { serviceById } = useCatalogMaps();
  const n = format.number;
  const hourLabel = (hour: number) => format.hour(atMinutes(new Date(2000, 0, 1), hour * 60));
  const serviceName = (id: string) => {
    const service = serviceById.get(id);
    return service ? localize(service.name) : t('common.deletedService');
  };
  const peakDay = report.byDay.reduce(
    (best, d) => (d.count > best.count ? d : best),
    report.byDay[0]!,
  );

  const dayData = report.byDay.map((d) => ({
    label:
      report.byDay.length <= 7
        ? `${format.weekday(d.date)} ${format.dayNumber(d.date)}`
        : format.dayNumber(d.date),
    value: d.count,
  }));
  const slices: DonutSlice[] = STATUS_ORDER.map((key) => ({
    key,
    label: t(`appointment.status.${key}`),
    value: report.byStatus[key],
    strokeClass: STATUS_CHART[key].stroke,
    dotClass: STATUS_CHART[key].dot,
  }));
  const hourData = report.byHour.map((h) => ({
    key: String(h.hour),
    label: hourLabel(h.hour),
    value: h.count,
  }));
  const serviceData = report.byService.slice(0, TOP_SERVICES).map((s) => ({
    key: s.serviceId,
    label: serviceName(s.serviceId),
    value: s.count,
  }));
  const topService = report.byService[0];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        title={t('reports.byDay.title')}
        summary={t('reports.byDay.summary', {
          total: n(report.total),
          day: format.dayMonth(peakDay.date),
          count: n(peakDay.count),
        })}
        columns={[t('reports.columns.day'), t('reports.columns.count')]}
        rows={report.byDay.map((d) => [format.date(d.date), n(d.count)])}
        chart={({ describedBy }) => (
          <BarChart
            data={dayData}
            rtl={rtl}
            formatNumber={n}
            ariaLabel={t('reports.byDay.title')}
            describedBy={describedBy}
          />
        )}
      />
      <ChartCard
        title={t('reports.byStatus.title')}
        summary={t('reports.byStatus.summary', {
          done: n(report.byStatus.done),
          cancelled: n(report.byStatus.cancelled),
          rate: format.percent(report.cancellationRate),
          noShow: n(report.noShow),
          noShowRate: format.percent(report.noShowRate),
        })}
        columns={[t('reports.columns.status'), t('reports.columns.count')]}
        rows={slices.map((s) => [s.label, n(s.value)])}
        chart={({ describedBy }) => (
          <DonutChart
            slices={slices}
            centerValue={n(report.total)}
            centerLabel={t('reports.kpi.total')}
            formatNumber={n}
            ariaLabel={t('reports.byStatus.title')}
            describedBy={describedBy}
          />
        )}
      />
      <ChartCard
        title={t('reports.byHour.title')}
        summary={
          report.busiestHour === null
            ? t('reports.byHour.none')
            : t('reports.byHour.summary', { hour: hourLabel(report.busiestHour) })
        }
        columns={[t('reports.columns.hour'), t('reports.columns.count')]}
        rows={hourData.map((h) => [h.label, n(h.value)])}
        chart={({ describedBy }) => (
          <HBarChart
            data={hourData}
            rtl={rtl}
            formatNumber={n}
            ariaLabel={t('reports.byHour.title')}
            describedBy={describedBy}
          />
        )}
      />
      <ChartCard
        title={t('myReports.byService.title')}
        summary={
          topService
            ? t('myReports.byService.summary', { service: serviceName(topService.serviceId) })
            : t('myReports.byService.none')
        }
        columns={[t('myReports.columns.service'), t('reports.columns.count')]}
        rows={serviceData.map((s) => [s.label, n(s.value)])}
        chart={({ describedBy }) => (
          <HBarChart
            data={serviceData}
            rtl={rtl}
            formatNumber={n}
            ariaLabel={t('myReports.byService.title')}
            describedBy={describedBy}
          />
        )}
      />
    </div>
  );
}

/** Loads (and reloads on Retry) the logged-in doctor's report for one range. */
function MyReportsBody({ range }: { range: RangeKey }) {
  const { t } = useTranslation();
  const format = useFormat();
  const load = useCallback(() => repositories.reports.myReport(range), [range]);
  const state = useAsync(load);
  const n = format.number;

  if (state.status === 'error') {
    return (
      <ErrorState
        title={t('myReports.errorTitle')}
        description={t('myReports.errorDescription')}
        onRetry={state.reload}
      />
    );
  }
  if (state.status === 'loading') return <ReportsSkeleton embedded />;

  const report = state.data;
  if (report.total === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line-strong bg-surface">
        <EmptyState
          icon={FileBarChart}
          title={t('myReports.emptyTitle')}
          description={t('myReports.emptyDescription')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={CalendarCheck}
          label={t('reports.kpi.total')}
          value={<AnimatedNumber value={report.total} format={n} />}
          hint={t('reports.kpi.done', { count: n(report.done) })}
        />
        <Kpi
          icon={Ban}
          label={t('reports.kpi.cancellationRate')}
          value={
            <AnimatedNumber
              value={Math.round(report.cancellationRate * 100)}
              format={(v) => format.percent(v / 100)}
            />
          }
          hint={t('reports.kpi.cancelled', { count: n(report.cancelled) })}
        />
        <Kpi
          icon={UserX}
          label={t('reports.kpi.noShowRate')}
          value={
            <AnimatedNumber
              value={Math.round(report.noShowRate * 100)}
              format={(v) => format.percent(v / 100)}
            />
          }
          hint={t('reports.kpi.noShow', { count: n(report.noShow) })}
        />
        <Kpi
          icon={CalendarRange}
          label={t('myReports.kpi.avgPerDay')}
          value={n(Math.round(report.avgPerWorkingDay * 10) / 10)}
          hint={t('myReports.kpi.workingDays', { count: n(report.workingDays) })}
        />
      </div>
      <Charts report={report} />
    </>
  );
}

/** The logged-in doctor's own numbers. Never shows other doctors or the clinic as a whole. */
export function MyReportsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const doctorId = useSessionStore((state) => state.session?.doctorId ?? null);
  const { doctorById } = useCatalogMaps();
  const [range, setRange] = useState<RangeKey>('7d');
  const dateRange = useMemo(() => resolveRange(range, now), [range, now]);
  const doctor = doctorId ? doctorById.get(doctorId) : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title={t('myReports.title')}
        subtitle={`${doctor ? `${localize(doctor.name)} · ` : ''}${format.range(dateRange.from, dateRange.to)}`}
        actions={
          <Segmented
            label={t('reports.range')}
            value={range}
            onChange={setRange}
            options={RANGES.map((key) => ({ value: key, label: t(`reports.ranges.${key}`) }))}
          />
        }
      />
      <p className="-mt-2 text-sm text-muted">{t('myReports.scope')}</p>
      <MyReportsBody key={range} range={range} />
    </div>
  );
}
