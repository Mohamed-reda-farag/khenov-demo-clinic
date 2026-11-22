import { cn } from '@/lib/cn';

/** Rounds a maximum up to a tidy axis limit (4, 5, 10, 20, 50...). */
function niceMax(value: number): number {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((m) => value <= m * magnitude) ?? 10;
  return step * magnitude;
}

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  rtl: boolean;
  /** Localizes the numbers on the axis and above the bars. */
  formatNumber: (value: number) => string;
  ariaLabel: string;
  /** Id of the element that holds the text summary of the chart. */
  describedBy?: string;
}

const W = 640;
const H = 260;
const PAD = { top: 16, bottom: 32, near: 44, far: 8 };

/** Vertical bars. In RTL the first item is on the right and the value axis sits on the right. */
export function BarChart({ data, rtl, formatNumber, ariaLabel, describedBy }: BarChartProps) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const plotLeft = rtl ? PAD.far : PAD.near;
  const plotRight = W - (rtl ? PAD.near : PAD.far);
  const plotW = plotRight - plotLeft;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(48, slot * 0.62);
  const labelEvery = Math.ceil(data.length / 8);
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      className="h-auto w-full"
    >
      {ticks.map((tick) => {
        const y = PAD.top + plotH - (tick / max) * plotH;
        return (
          <g key={tick}>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={y}
              y2={y}
              className="stroke-line"
              strokeWidth={1}
            />
            <text
              x={rtl ? plotRight + 8 : plotLeft - 8}
              y={y + 4}
              textAnchor={rtl ? 'start' : 'end'}
              className="fill-muted text-xs"
            >
              {formatNumber(tick)}
            </text>
          </g>
        );
      })}
      {data.map((datum, index) => {
        const position = rtl ? data.length - 1 - index : index;
        const x = plotLeft + position * slot + (slot - barW) / 2;
        const height = (datum.value / max) * plotH;
        const y = PAD.top + plotH - height;
        return (
          <g key={`${datum.label}-${index}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(height, datum.value > 0 ? 2 : 0)}
              rx={4}
              className="fill-primary"
            />
            {data.length <= 10 && datum.value > 0 && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                className="fill-fg text-xs font-semibold"
              >
                {formatNumber(datum.value)}
              </text>
            )}
            {index % labelEvery === 0 && (
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="fill-muted text-xs">
                {datum.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** Tailwind `stroke-*` class. */
  strokeClass: string;
  /** Tailwind `bg-*` class for the legend dot. */
  dotClass: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  formatNumber: (value: number) => string;
  ariaLabel: string;
  describedBy?: string;
}

const RADIUS = 70;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
  formatNumber,
  ariaLabel,
  describedBy,
}: DonutChartProps) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        className="size-48 shrink-0"
      >
        <circle
          cx={100}
          cy={100}
          r={RADIUS}
          fill="none"
          strokeWidth={26}
          className="stroke-sunken"
        />
        {total > 0 &&
          slices
            .filter((slice) => slice.value > 0)
            .map((slice) => {
              const length = (slice.value / total) * CIRCUMFERENCE;
              const circle = (
                <circle
                  key={slice.key}
                  cx={100}
                  cy={100}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={26}
                  className={slice.strokeClass}
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 100 100)"
                />
              );
              offset += length;
              return circle;
            })}
        <text x={100} y={98} textAnchor="middle" className="font-semibold fill-fg text-2xl">
          {centerValue}
        </text>
        <text x={100} y={120} textAnchor="middle" className="fill-muted text-xs">
          {centerLabel}
        </text>
      </svg>
      <ul className="flex flex-col gap-3 text-sm">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-3">
            <span aria-hidden className={cn('size-3 rounded-full', slice.dotClass)} />
            <span className="text-muted">{slice.label}</span>
            <span className="ms-auto ps-4 font-semibold text-fg">{formatNumber(slice.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface HBarDatum {
  key: string;
  label: string;
  value: number;
  /** Tailwind `fill-*` class (defaults to the brand color). */
  fillClass?: string;
}

interface HBarChartProps {
  data: HBarDatum[];
  rtl: boolean;
  formatNumber: (value: number) => string;
  ariaLabel: string;
  describedBy?: string;
}

/** Horizontal bars: a text label, an SVG bar and the value, mirrored automatically in RTL. */
export function HBarChart({ data, rtl, formatNumber, ariaLabel, describedBy }: HBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul aria-label={ariaLabel} aria-describedby={describedBy} className="flex flex-col gap-2">
      {data.map((datum) => {
        const width = (datum.value / max) * 100;
        return (
          <li key={datum.key} className="flex items-center gap-3 text-sm">
            <span className="w-28 shrink-0 truncate text-muted">{datum.label}</span>
            <svg
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              aria-hidden
              className="h-3 min-w-0 flex-1"
            >
              <rect x={0} y={0} width={100} height={10} rx={2} className="fill-sunken" />
              {datum.value > 0 && (
                <rect
                  x={rtl ? 100 - width : 0}
                  y={0}
                  width={width}
                  height={10}
                  rx={2}
                  className={datum.fillClass ?? 'fill-primary'}
                />
              )}
            </svg>
            <span className="w-8 shrink-0 text-end font-semibold text-fg">
              {formatNumber(datum.value)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
