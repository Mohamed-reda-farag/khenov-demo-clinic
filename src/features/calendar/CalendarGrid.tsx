import { Plus } from 'lucide-react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import type { Appointment, Doctor, Patient, Service } from '@/data/types';
import { DOCTOR_DOT } from '@/features/appointments/statusStyles';
import { useAppointmentActions } from '@/features/appointments/useAppointmentActions';
import { useConflictText } from '@/features/appointments/useConflictText';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { findConflicts, type Conflict } from '@/lib/scheduling/conflicts';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR, SLOT_STEP_MIN } from '@/lib/scheduling/constants';
import { layoutLanes } from '@/lib/scheduling/layout';
import { atMinutes, endOf, snapMinutes } from '@/lib/scheduling/time';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useUiStore } from '@/stores/uiStore';
import { AppointmentBlock } from './AppointmentBlock';
import {
  COLUMN_MIN_WIDTH,
  GRID_HEIGHT,
  GUTTER_WIDTH,
  PX_PER_HOUR,
  PX_PER_MIN,
  TOTAL_MIN,
  type CalendarColumn,
} from './constants';

const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i,
);
const DRAG_THRESHOLD_PX = 5;

interface Lookups {
  doctorById: Map<string, Doctor>;
  patientById: Map<string, Patient>;
  serviceById: Map<string, Service>;
}

interface Ghost {
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
  timeLabel: string;
  problem: string | null;
}

interface DropTarget {
  appointment: Appointment;
  start: Date;
  doctorId: string;
  day: Date;
  conflicts: Conflict[];
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

interface ColumnProps {
  column: CalendarColumn;
  index: number;
  appointments: Appointment[];
  lookups: Lookups;
  nowMinutes: number | null;
  dragActive: boolean;
  draggingId: string | null;
  setRef: (index: number, element: HTMLDivElement | null) => void;
  onSlotClick: (column: CalendarColumn, startMin: number) => void;
  onOpen: (id: string) => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>, appointment: Appointment) => void;
}

const Column = memo(function Column({
  column,
  index,
  appointments,
  lookups,
  nowMinutes,
  dragActive,
  draggingId,
  setRef,
  onSlotClick,
  onOpen,
  onDragStart,
}: ColumnProps) {
  const { t } = useTranslation();
  const hoverRef = useRef<HTMLDivElement>(null);

  const lanes = useMemo(
    () =>
      layoutLanes(
        appointments.map((a) => {
          const start = new Date(a.start);
          const startMin = start.getHours() * 60 + start.getMinutes();
          return { id: a.id, start: startMin, end: startMin + a.durationMin };
        }),
      ),
    [appointments],
  );

  const slotMinutes = (event: { clientY: number; currentTarget: HTMLDivElement }) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const raw = Math.floor((event.clientY - rect.top) / PX_PER_MIN / SLOT_STEP_MIN) * SLOT_STEP_MIN;
    return Math.min(TOTAL_MIN - SLOT_STEP_MIN, Math.max(0, raw));
  };

  return (
    <div
      ref={(element) => setRef(index, element)}
      role="group"
      aria-label={column.label}
      className="calendar-lines relative cursor-cell border-s border-line"
      style={{ height: GRID_HEIGHT, '--hour-h': `${PX_PER_HOUR}px` } as CSSProperties}
      onClick={(event) => {
        if (event.target === event.currentTarget) onSlotClick(column, slotMinutes(event));
      }}
      onPointerMove={(event) => {
        const hover = hoverRef.current;
        if (!hover) return;
        if (dragActive || event.target !== event.currentTarget) {
          hover.style.opacity = '0';
          return;
        }
        hover.style.transform = `translateY(${slotMinutes(event) * PX_PER_MIN}px)`;
        hover.style.opacity = '1';
      }}
      onPointerLeave={() => {
        if (hoverRef.current) hoverRef.current.style.opacity = '0';
      }}
    >
      <div
        ref={hoverRef}
        aria-hidden
        title={t('calendar.newAppointment')}
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center rounded-sm bg-primary-soft text-primary-strong opacity-0"
        style={{ height: SLOT_STEP_MIN * PX_PER_MIN }}
      >
        <Plus className="size-4" />
      </div>

      {appointments.map((appointment) => {
        const lane = lanes.get(appointment.id) ?? { lane: 0, lanes: 1 };
        return (
          <AppointmentBlock
            key={appointment.id}
            appointment={appointment}
            patient={lookups.patientById.get(appointment.patientId)}
            doctor={lookups.doctorById.get(appointment.doctorId)}
            service={lookups.serviceById.get(appointment.serviceId)}
            lane={lane.lane}
            lanes={lane.lanes}
            dragging={draggingId === appointment.id}
            onOpen={onOpen}
            onDragStart={onDragStart}
          />
        );
      })}

      {nowMinutes !== null && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 z-[2] h-0.5 bg-danger"
          style={{ top: nowMinutes * PX_PER_MIN }}
        >
          <span className="absolute -top-1 start-0 size-2.5 rounded-full bg-danger" />
        </div>
      )}
    </div>
  );
});

interface CalendarGridProps {
  columns: CalendarColumn[];
  appointments: Appointment[];
  lookups: Lookups;
  /** Doctor filter value used when a slot is clicked and the column has no doctor. */
  filterDoctorId: string | null;
  view: 'week' | 'day';
}

export function CalendarGrid({
  columns,
  appointments,
  lookups,
  filterDoctorId,
  view,
}: CalendarGridProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const actions = useAppointmentActions();
  const conflictText = useConflictText();
  const openDetail = useUiStore((state) => state.openDetail);
  const openForm = useUiStore((state) => state.openForm);

  const scrollRef = useRef<HTMLDivElement>(null);
  const columnEls = useRef<Array<HTMLDivElement | null>>([]);
  const suppressClick = useRef(false);
  const dropRef = useRef<DropTarget | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);

  // Latest values for the window-level drag listeners (updated after every render).
  const latest = useRef({ columns, lookups, actions, conflictText, format });
  useEffect(() => {
    latest.current = { columns, lookups, actions, conflictText, format };
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const target = (nowMin - CALENDAR_START_HOUR * 60 - 60) * PX_PER_MIN;
    el.scrollTop = Math.max(0, Math.min(target, GRID_HEIGHT));
  }, []);

  const setRef = useCallback((index: number, element: HTMLDivElement | null) => {
    columnEls.current[index] = element;
  }, []);

  const byColumn = useMemo(
    () =>
      columns.map((column) =>
        appointments.filter(
          (a) =>
            sameDay(new Date(a.start), column.date) &&
            (column.doctorId === null || a.doctorId === column.doctorId),
        ),
      ),
    [columns, appointments],
  );

  const handleOpen = useCallback(
    (id: string) => {
      if (suppressClick.current) return;
      openDetail(id);
    },
    [openDetail],
  );

  const handleSlotClick = useCallback(
    (column: CalendarColumn, startMin: number) => {
      openForm({
        mode: 'create',
        start: atMinutes(column.date, CALENDAR_START_HOUR * 60 + startMin),
        doctorId: column.doctorId ?? filterDoctorId,
      });
    },
    [openForm, filterDoctorId],
  );

  const handleDragStart = useCallback(
    (event: PointerEvent<HTMLButtonElement>, appointment: Appointment) => {
      if (event.button !== 0 || event.pointerType === 'touch') return;
      const origin = { x: event.clientX, y: event.clientY };
      const offsetY = event.clientY - event.currentTarget.getBoundingClientRect().top;
      let active = false;
      let lastKey = '';

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      const finish = (apply: boolean) => {
        cleanup();
        const drop = dropRef.current;
        dropRef.current = null;
        setGhost(null);
        if (!active) return;
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 60);
        if (!apply || !drop) return;
        const { actions: api } = latest.current;
        if (drop.conflicts.length > 0) {
          api.reportBlocked(drop.conflicts[0]!, drop.appointment, {
            doctorId: drop.doctorId,
            day: drop.day,
          });
          return;
        }
        const unchanged =
          drop.start.getTime() === new Date(appointment.start).getTime() &&
          drop.doctorId === appointment.doctorId;
        if (!unchanged)
          void api.edit(drop.appointment, { start: drop.start, doctorId: drop.doctorId });
      };

      function onMove(move: globalThis.PointerEvent) {
        if (!active) {
          if (Math.hypot(move.clientX - origin.x, move.clientY - origin.y) < DRAG_THRESHOLD_PX)
            return;
          active = true;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
        }
        const {
          columns: cols,
          lookups: maps,
          conflictText: describe,
          format: fmt,
        } = latest.current;
        const rects = columnEls.current.map((el) => el?.getBoundingClientRect() ?? null);
        let index = rects.findIndex((r) => r && move.clientX >= r.left && move.clientX <= r.right);
        if (index === -1) {
          const distance = (r: DOMRect | null) =>
            r
              ? Math.min(Math.abs(move.clientX - r.left), Math.abs(move.clientX - r.right))
              : Infinity;
          index = rects.reduce(
            (best, r, i) => (distance(r) < distance(rects[best] ?? null) ? i : best),
            0,
          );
        }
        const rect = rects[index];
        const column = cols[index];
        const doctor = maps.doctorById.get(column?.doctorId ?? appointment.doctorId);
        if (!rect || !column || !doctor) return;

        const scroller = scrollRef.current;
        if (scroller) {
          const bounds = scroller.getBoundingClientRect();
          if (move.clientY < bounds.top + 56) scroller.scrollTop -= 14;
          else if (move.clientY > bounds.bottom - 56) scroller.scrollTop += 14;
        }

        const rawMin = (move.clientY - offsetY - rect.top) / PX_PER_MIN;
        const startMin = Math.min(
          TOTAL_MIN - appointment.durationMin,
          Math.max(0, snapMinutes(rawMin, SLOT_STEP_MIN)),
        );
        const key = `${index}:${startMin}`;
        if (key === lastKey) return;
        lastKey = key;

        const start = atMinutes(column.date, CALENDAR_START_HOUR * 60 + startMin);
        const conflicts = findConflicts(
          {
            doctorId: doctor.id,
            patientId: appointment.patientId,
            start,
            durationMin: appointment.durationMin,
            ignoreId: appointment.id,
          },
          useAppointmentsStore.getState().items,
          doctor,
        );
        dropRef.current = { appointment, start, doctorId: doctor.id, day: column.date, conflicts };
        const first = conflicts[0];
        setGhost({
          id: appointment.id,
          left: rect.left + 2,
          top: rect.top + startMin * PX_PER_MIN,
          width: rect.width - 4,
          height: appointment.durationMin * PX_PER_MIN - 2,
          timeLabel: `${fmt.time(start)} – ${fmt.time(endOf(start, appointment.durationMin))}`,
          problem: first
            ? describe(first, {
                doctorId: doctor.id,
                patientId: appointment.patientId,
                day: column.date,
              })
            : null,
        });
      }
      const onUp = () => finish(true);
      const onCancel = () => finish(false);
      const onKey = (key: KeyboardEvent) => {
        if (key.key === 'Escape') finish(false);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey);
    },
    [],
  );

  const todayIndex = columns.findIndex((column) => sameDay(column.date, now));
  const nowMin = now.getHours() * 60 + now.getMinutes() - CALENDAR_START_HOUR * 60;
  const nowVisible = nowMin >= 0 && nowMin <= TOTAL_MIN;

  return (
    <>
      <div
        ref={scrollRef}
        role="region"
        aria-label={t('calendar.gridLabel')}
        className="relative min-h-0 flex-1 overflow-auto rounded-lg border border-line bg-surface shadow-sm"
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${GUTTER_WIDTH} repeat(${columns.length}, minmax(${COLUMN_MIN_WIDTH}, 1fr))`,
            minWidth: `calc(${GUTTER_WIDTH} + ${columns.length} * ${COLUMN_MIN_WIDTH})`,
          }}
        >
          <div className="sticky start-0 top-0 z-30 border-b border-line bg-surface" />
          {columns.map((column) => {
            const doctor =
              column.doctorId && view === 'day'
                ? lookups.doctorById.get(column.doctorId)
                : undefined;
            const today = sameDay(column.date, now);
            return (
              <div
                key={column.key}
                className="sticky top-0 z-20 flex h-16 flex-col items-center justify-center gap-1 border-b border-s border-line bg-surface px-2 text-center"
              >
                {doctor ? (
                  <>
                    <span className="flex max-w-full items-center gap-2 text-sm font-semibold text-fg">
                      <span
                        aria-hidden
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          DOCTOR_DOT[doctor.colorToken],
                        )}
                      />
                      <span className="truncate">{localize(doctor.name)}</span>
                    </span>
                    <span className="max-w-full truncate text-xs text-muted">
                      {localize(doctor.specialty)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-muted">{format.weekday(column.date)}</span>
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full text-sm font-semibold',
                        today ? 'bg-primary text-on-primary' : 'text-fg',
                      )}
                    >
                      {format.dayNumber(column.date)}
                    </span>
                  </>
                )}
              </div>
            );
          })}

          <div
            className="sticky start-0 z-10 border-e border-line bg-surface"
            style={{ height: GRID_HEIGHT }}
          >
            {HOURS.map((hour) => (
              <span
                key={hour}
                className="absolute inset-x-0 px-2 pt-1 text-end text-xs text-subtle"
                style={{ top: (hour - CALENDAR_START_HOUR) * PX_PER_HOUR }}
              >
                {format.hour(atMinutes(new Date(2000, 0, 1), hour * 60))}
              </span>
            ))}
          </div>
          {columns.map((column, index) => (
            <Column
              key={column.key}
              column={column}
              index={index}
              appointments={byColumn[index] ?? []}
              lookups={lookups}
              nowMinutes={index === todayIndex && nowVisible ? nowMin : null}
              dragActive={ghost !== null}
              draggingId={ghost?.id ?? null}
              setRef={setRef}
              onSlotClick={handleSlotClick}
              onOpen={handleOpen}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {ghost && (
        <div
          aria-hidden
          className={cn(
            'drag-ghost pointer-events-none fixed left-0 top-0 z-50 flex flex-col overflow-hidden rounded-md border-2 px-2 py-1 text-xs shadow-lg',
            ghost.problem
              ? 'border-danger bg-danger-soft text-danger'
              : 'border-primary bg-primary-soft text-primary-strong',
          )}
          style={{
            transform: `translate(${ghost.left}px, ${ghost.top}px)`,
            width: ghost.width,
            height: ghost.height,
          }}
        >
          <span className="font-semibold">{ghost.timeLabel}</span>
          {ghost.problem && <span className="line-clamp-2">{ghost.problem}</span>}
        </div>
      )}
    </>
  );
}
