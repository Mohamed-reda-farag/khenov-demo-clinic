import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Ban, CalendarCheck, Clock, FileBarChart, Stethoscope, UserX } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Segmented';
import { useCatalogMaps } from '@/features/appointments/useCatalogMaps';
import { useDataStatus, useReloadData } from '@/features/appointments/useDataStatus';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { buildReport, resolveRange, type RangeKey } from '@/lib/reports/aggregate';
import { atMinutes } from '@/lib/scheduling/time';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { usePrefsStore } from '@/stores/prefsStore';
import { ChartCard } from './ChartCard';
import { Kpi, STATUS_CHART, STATUS_ORDER } from './reportParts';
import { BarChart, DonutChart, HBarChart, type DonutSlice } from './charts';
import { ReportsSkeleton } from './ReportsSkeleton';

const RANGES: RangeKey[] = ['7d', '30d', 'week'];
const DOCTOR_FILL = {
  'doctor-1': 'fill-doctor-1',
  'doctor-2': 'fill-doctor-2',
  'doctor-3': 'fill-doctor-3',
  'doctor-4': 'fill-doctor-4',
} as const;

export function ReportsScreen() {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const rtl = usePrefsStore((state) => state.lang) === 'ar';
  const status = useDataStatus();
  const reload = useReloadData();
  const { doctorById } = useCatalogMaps();
  const doctors = useCatalogStore((state) => state.doctors);
  const appointments = useAppointmentsStore((state) => state.items);
  const [range, setRange] = useState<RangeKey>('7d');

  const dateRange = useMemo(() => resolveRange(range, now), [range, now]);
  const report = useMemo(
    () =>
      buildReport(
        appointments,
        dateRange,
        doctors.map((d) => d.id),
      ),
    [appointments, dateRange, doctors],
  );

  if (status === 'error') {
    return (
      <ErrorState
        title={t('reports.errorTitle')}
        description={t('reports.errorDescription')}
        onRetry={reload}
      />
    );
  }
  if (status !== 'ready') return <ReportsSkeleton />;

  const n = format.number;
  const hourLabel = (hour: number) => format.hour(atMinutes(new Date(2000, 0, 1), hour * 60));
  const rangeLabel = format.range(dateRange.from, dateRange.to);
  const doctorName = (id: string | null) =>
    id && doctorById.get(id) ? localize(doctorById.get(id)!.name) : '—';
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
  const doctorData = [...report.byDoctor]
    .sort((a, b) => b.count - a.count)
    .map((d) => ({
      key: d.doctorId,
      label: doctorName(d.doctorId),
      value: d.count,
      fillClass: DOCTOR_FILL[doctorById.get(d.doctorId)?.colorToken ?? 'doctor-1'],
    }));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <PageHeader
        title={t('reports.title')}
        subtitle={rangeLabel}
        actions={
          <Segmented
            label={t('reports.range')}
            value={range}
            onChange={setRange}
            options={RANGES.map((key) => ({ value: key, label: t(`reports.ranges.${key}`) }))}
          />
        }
      />

      {report.total === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface">
          <EmptyState
            icon={FileBarChart}
            title={t('reports.emptyTitle')}
            description={t('reports.emptyDescription')}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
              icon={Clock}
              label={t('reports.kpi.busiestHour')}
              value={report.busiestHour === null ? '—' : hourLabel(report.busiestHour)}
            />
            <Kpi
              icon={Stethoscope}
              label={t('reports.kpi.busiestDoctor')}
              value={doctorName(report.busiestDoctorId)}
            />
          </div>

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
              title={t('reports.byDoctor.title')}
              summary={t('reports.byDoctor.summary', {
                doctor: doctorName(report.busiestDoctorId),
              })}
              columns={[t('reports.columns.doctor'), t('reports.columns.count')]}
              rows={doctorData.map((d) => [d.label, n(d.value)])}
              chart={({ describedBy }) => (
                <HBarChart
                  data={doctorData}
                  rtl={rtl}
                  formatNumber={n}
                  ariaLabel={t('reports.byDoctor.title')}
                  describedBy={describedBy}
                />
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
