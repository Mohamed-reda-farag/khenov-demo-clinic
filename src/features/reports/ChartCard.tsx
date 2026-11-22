import { BarChart3, Table2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface ChartCardProps {
  title: string;
  /** One sentence that says what the chart shows (also read by screen readers). */
  summary: string;
  /** Receives the id of the summary so the chart can be described by it. */
  chart: (props: { describedBy: string }) => ReactNode;
  columns: [string, string];
  rows: Array<[string, string]>;
}

/** A chart with a text summary and a "show as table" switch (the same numbers as a real table). */
export function ChartCard({ title, summary, chart, columns, rows }: ChartCardProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const summaryId = useId();
  const [asTable, setAsTable] = useState(false);
  const Icon = asTable ? BarChart3 : Table2;

  return (
    <figure
      aria-labelledby={titleId}
      className="anim-rise-in flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold text-fg">
          {title}
        </h2>
        <button
          type="button"
          aria-pressed={asTable}
          onClick={() => setAsTable((current) => !current)}
          className="press inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-primary-strong hover:bg-primary-soft"
        >
          <Icon className="size-4" aria-hidden />
          {asTable ? t('reports.showChart') : t('reports.showTable')}
        </button>
      </div>
      {asTable ? (
        <div className="max-h-72 overflow-auto rounded-md border border-line">
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th scope="col" className="px-3 py-2 text-start font-semibold">
                  {columns[0]}
                </th>
                <th scope="col" className="px-3 py-2 text-end font-semibold">
                  {columns[1]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <th scope="row" className="px-3 py-2 text-start font-normal text-muted">
                    {label}
                  </th>
                  <td className="px-3 py-2 text-end font-semibold text-fg">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        chart({ describedBy: summaryId })
      )}
      <figcaption id={summaryId} className="text-sm text-muted">
        {summary}
      </figcaption>
    </figure>
  );
}
