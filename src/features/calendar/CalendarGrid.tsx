import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Appointment, Doctor, Patient, Service } from '@/data/types';
import { DOCTOR_DOT } from '@/features/appointments/statusStyles';
import { useAppointmentActions } from '@/features/appointments/useAppointmentActions';
import { useConflictText } from '@/features/appointments/useConflictText';
import { useFormat } from '@/i18n/useFormat';
import { useLocalized } from '@/i18n/useLocalized';
import { cn } from '@/lib/cn';
import { now as clockNow } from '@/lib/clock';
import { findConflicts, type Conflict } from '@/lib/scheduling/conflicts';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR, SLOT_STEP_MIN } from '@/lib/scheduling/constants';
import { grabOffset, resolveDrag, shiftRect, type Rect } from '@/lib/scheduling/drag';
import { layoutLanes } from '@/lib/scheduling/layout';
import { isLockedStatus } from '@/lib/scheduling/status';
import { atMinutes, endOf } from '@/lib/scheduling/time';
import { useNow } from '@/lib/useNow';
import { useAppointmentsStore } from '@/stores/appointmentsStore';
import { useUiStore } from '@/stores/uiStore';
import { AppointmentBlock } from './AppointmentBlock';
import { DRAG_DEBUG, type DragDebugInfo } from './dragDebug';
import {
  COLUMN_MIN_WIDTH,
  GRID_HEIGHT,
  GUTTER_PX,
  GUTTER_WIDTH,
  HEADER_HEIGHT,
  PX_PER_HOUR,
  PX_PER_MIN,
  TOTAL_MIN,
  type CalendarColumn,
} from './constants';

// Dev-only (?debug=drag): a constant `false` in production builds, so the chunk is never emitted.
const DragDebugOverlay =
  import.meta.env.DEV && DRAG_DEBUG ? lazy(() => import('./DragDebugOverlay')) : null;

const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i,
);
const DRAG_THRESHOLD_PX = 5;
/** Distance from the grid edge (px) where dragging starts to scroll it. */
const SCROLL_ZONE_PX = 72;
const MAX_SCROLL_SPEED = 20;

interface Lookups {
  doctorById: Map<string, Doctor>;
  patientById: Map<string, Patient>;
  serviceById: Map<string, Service>;
}

/** A fixed-position box (viewport px) with the part hidden under the sticky header / below the grid. */
interface FloatingBox {
  left: number;
  top: number;
  width: number;
  height: number;
  clipTop: number;
  clipBottom: number;
  clipLeft: number;
  clipRight: number;
}

interface Ghost {
  id: string;
  /** The card itself, glued to the pointer at the exact point where it was grabbed. */
  card: FloatingBox;
  /** The snapped slot the card would land in (computed from the card's top edge). */
  slot: FloatingBox;
  timeLabel: string;
  problem: string | null;
  debug: DragDebugInfo;
}

interface DropTarget {
  appointment: Appointment;
  start: Date;
  doctorId: string;
  day: Date;
  conflicts: Conflict[];
}

/** Fixed-position style (transform only) for a floating box, clipped at the grid edges. */
const floatingStyle = (box: FloatingBox): CSSProperties => ({
  transform: `translate(${box.left}px, ${box.top}px)`,
  width: box.width,
  height: box.height,
  clipPath: `inset(${box.clipTop}px ${box.clipRight}px ${box.clipBottom}px ${box.clipLeft}px)`,
});

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** 0 outside the zone, growing to 1 at the very edge. */
const edgePressure = (distanceIntoZone: number) =>
  Math.min(1, Math.max(0, distanceIntoZone / SCROLL_ZONE_PX));

interface ColumnProps {
  column: CalendarColumn;
  index: number;
  appointments: Appointment[];
  lookups: Lookups;
  nowMinutes: number | null;
  readOnly: boolean;
  draggingId: string | null;
  setRef: (index: number, element: HTMLDivElement | null) => void;
  onOpen: (id: string) => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>, appointment: Appointment) => void;
}

/** One day (or doctor) column. Cells are not interactive: appointments are booked from the toolbar, N or the palette. */
const Column = memo(function Column({
  column,
  index,
  appointments,
  lookups,
  nowMinutes,
  readOnly,
  draggingId,
  setRef,
  onOpen,
  onDragStart,
}: ColumnProps) {
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

  return (
    <div
      ref={(element) => setRef(index, element)}
      role="group"
      aria-label={column.label}
      className="calendar-lines relative border-s border-line"
      style={{ height: GRID_HEIGHT, '--hour-h': `${PX_PER_HOUR}px` } as CSSProperties}
    >
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
            draggable={!readOnly && !isLockedStatus(appointment.status)}
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
  view: 'week' | 'day';
  /** No dragging (doctor schedule views). */
  readOnly?: boolean;
}

export function CalendarGrid({
  columns,
  appointments,
  lookups,
  view,
  readOnly = false,
}: CalendarGridProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const localize = useLocalized();
  const now = useNow();
  const actions = useAppointmentActions();
  const conflictText = useConflictText();
  const openDetail = useUiStore((state) => state.openDetail);

  const scrollRef = useRef<HTMLDivElement>(null);
  const columnEls = useRef<Array<HTMLDivElement | null>>([]);
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
    const current = clockNow();
    const nowMin = current.getHours() * 60 + current.getMinutes();
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
            (column.doctorId === null
              ? !column.doctorIds || column.doctorIds.includes(a.doctorId)
              : a.doctorId === column.doctorId),
        ),
      ),
    [columns, appointments],
  );

  const handleDragStart = useCallback(
    (event: PointerEvent<HTMLButtonElement>, appointment: Appointment) => {
      // Done, Cancelled and No-show appointments are locked (the repository refuses them too).
      if (event.button !== 0 || event.pointerType === 'touch' || isLockedStatus(appointment.status))
        return;
      const origin = { x: event.clientX, y: event.clientY };
      const pointer = { x: event.clientX, y: event.clientY };
      // Where the card was grabbed (pointer minus the card's top-left corner). Physical px, so it
      // is the same in LTR and RTL.
      const cardRect = event.currentTarget.getBoundingClientRect();
      const offset = grabOffset(pointer, cardRect);
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;
      let active = false;
      let dirty = false;
      let frame = 0;

      // Column rectangles (viewport px) are measured once, then moved by the distance the grid has
      // scrolled since (no layout reads while dragging).
      let measured: { rects: Array<Rect | null>; left: number; top: number } | null = null;
      const columnRects = (): Array<Rect | null> => {
        const scroller = scrollRef.current;
        if (!scroller) return [];
        if (!measured) {
          measured = {
            rects: columnEls.current.map((el) => {
              const r = el?.getBoundingClientRect();
              return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
            }),
            left: scroller.scrollLeft,
            top: scroller.scrollTop,
          };
        }
        const scrolled = {
          x: scroller.scrollLeft - measured.left,
          y: scroller.scrollTop - measured.top,
        };
        return measured.rects.map((r) => (r ? shiftRect(r, scrolled) : null));
      };
      let scrollerBounds: DOMRect | null = null;

      /** Works out the snapped drop position under the pointer and updates the ghost. */
      const process = () => {
        const {
          columns: cols,
          lookups: maps,
          conflictText: describe,
          format: fmt,
        } = latest.current;
        const scroller = scrollRef.current;
        const rects = columnRects();
        // ONE space (viewport px): the ghost is at pointer - grabOffset, the column comes from its
        // horizontal centre and the snapped time from its top edge.
        const drag = resolveDrag({
          pointer,
          offset,
          card: { width: cardWidth, height: cardHeight },
          columns: rects,
          pxPerMin: PX_PER_MIN,
          stepMin: SLOT_STEP_MIN,
          durationMin: appointment.durationMin,
          totalMin: TOTAL_MIN,
        });
        const column = drag ? cols[drag.columnIndex] : undefined;
        const rect = drag ? rects[drag.columnIndex] : undefined;
        const doctor = maps.doctorById.get(column?.doctorId ?? appointment.doctorId);
        if (!drag || !rect || !column || !doctor || !scroller) return;
        scrollerBounds ??= scroller.getBoundingClientRect();
        const startMin = drag.startMin;
        const bounds = scrollerBounds;
        // The sticky header is drawn over the grid: never let the ghost cover or hide behind it.
        const box = (left: number, top: number, width: number, height: number): FloatingBox => ({
          left,
          top,
          width,
          height,
          clipTop: Math.max(0, bounds.top + HEADER_HEIGHT - top),
          clipBottom: Math.max(0, top + height - bounds.bottom),
          clipLeft: Math.max(0, bounds.left - left),
          clipRight: Math.max(0, left + width - bounds.right),
        });
        const slotHeight = appointment.durationMin * PX_PER_MIN - 2;
        const slotTop = rect.top + startMin * PX_PER_MIN;

        const start = atMinutes(column.date, CALENDAR_START_HOUR * 60 + startMin);
        // Moving into the past is refused; dropping back on the original spot is not a move.
        const moved =
          start.getTime() !== new Date(appointment.start).getTime() ||
          doctor.id !== appointment.doctorId;
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
          { now: moved ? clockNow() : undefined },
        );
        dropRef.current = { appointment, start, doctorId: doctor.id, day: column.date, conflicts };
        const first = conflicts[0];
        setGhost({
          id: appointment.id,
          card: box(drag.ghost.left, drag.ghost.top, drag.ghost.width, drag.ghost.height),
          slot: box(rect.left + 2, slotTop, rect.width - 4, slotHeight),
          timeLabel: `${fmt.time(start)} – ${fmt.time(endOf(start, appointment.durationMin))}`,
          debug: {
            pointer: { x: pointer.x, y: pointer.y },
            offset,
            ghostTop: drag.ghost.top,
            columnIndex: drag.columnIndex,
            startMin,
          },
          problem: first
            ? describe(first, {
                doctorId: doctor.id,
                patientId: appointment.patientId,
                day: column.date,
              })
            : null,
        });
      };

      /** One step per animation frame: scroll when the pointer rests near an edge, then update the ghost. */
      const tick = () => {
        frame = requestAnimationFrame(tick);
        const scroller = scrollRef.current;
        if (!scroller) return;
        const bounds = (scrollerBounds ??= scroller.getBoundingClientRect());
        const rtl = document.documentElement.dir === 'rtl';
        const topEdge = bounds.top + HEADER_HEIGHT;
        const leftEdge = bounds.left + (rtl ? 0 : GUTTER_PX);
        const rightEdge = bounds.right - (rtl ? GUTTER_PX : 0);

        const up = edgePressure(topEdge + SCROLL_ZONE_PX - pointer.y);
        const down = edgePressure(pointer.y - (bounds.bottom - SCROLL_ZONE_PX));
        const left = edgePressure(leftEdge + SCROLL_ZONE_PX - pointer.x);
        const right = edgePressure(pointer.x - (rightEdge - SCROLL_ZONE_PX));
        const dy = Math.ceil((down - up) * MAX_SCROLL_SPEED);
        const dx = Math.ceil((right - left) * MAX_SCROLL_SPEED);

        let scrolled = false;
        if (dx !== 0 || dy !== 0) {
          const before = [scroller.scrollLeft, scroller.scrollTop];
          scroller.scrollBy(dx, dy);
          scrolled = scroller.scrollLeft !== before[0] || scroller.scrollTop !== before[1];
        }
        if (dirty || scrolled) {
          dirty = false;
          process();
        }
      };

      const cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('keydown', onKey);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };

      const finish = (apply: boolean) => {
        if (active && apply) {
          process();
        }
        cleanup();
        const drop = dropRef.current;
        dropRef.current = null;
        setGhost(null);
        if (!active) return;

        // The browser fires a click after the pointer is released. Swallow it so a drop can never
        // open the appointment (or trigger anything else under the pointer).
        const swallowClick = (click: MouseEvent) => {
          click.stopPropagation();
          click.preventDefault();
        };
        window.addEventListener('click', swallowClick, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallowClick, { capture: true }), 120);

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
        pointer.x = move.clientX;
        pointer.y = move.clientY;
        if (!active) {
          if (Math.hypot(pointer.x - origin.x, pointer.y - origin.y) < DRAG_THRESHOLD_PX) return;
          active = true;
          document.body.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
          frame = requestAnimationFrame(tick);
        }
        dirty = true;
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
          <div
            className="sticky start-0 top-0 z-30 border-b border-line bg-surface"
            style={{ height: HEADER_HEIGHT }}
          />
          {columns.map((column) => {
            const doctor =
              column.doctorId && view === 'day'
                ? lookups.doctorById.get(column.doctorId)
                : undefined;
            const today = sameDay(column.date, now);
            return (
              <div
                key={column.key}
                className="sticky top-0 z-20 flex flex-col items-center justify-center gap-1 border-b border-s border-line bg-surface px-2 text-center"
                style={{ height: HEADER_HEIGHT }}
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
              readOnly={readOnly}
              draggingId={ghost?.id ?? null}
              setRef={setRef}
              onOpen={openDetail}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {ghost &&
        createPortal(
          <>
            {/* Where the appointment will land (snapped to the grid, from the card's top edge). */}
            <div
              aria-hidden
              className={cn(
                'drag-ghost pointer-events-none fixed left-0 top-0 z-40 rounded-md border-2 border-dashed',
                ghost.problem
                  ? 'border-danger bg-danger-soft/60'
                  : 'border-primary bg-primary-soft/60',
              )}
              style={floatingStyle(ghost.slot)}
            />
            {/* The card itself, under the pointer at the point where it was grabbed. */}
            <div
              aria-hidden
              className={cn(
                'pointer-events-none fixed left-0 top-0 z-50 flex flex-col overflow-hidden rounded-md border-2 px-2 py-1 text-xs shadow-lg',
                ghost.problem
                  ? 'border-danger bg-danger-soft text-danger'
                  : 'border-primary bg-primary-soft text-primary-strong',
              )}
              style={floatingStyle(ghost.card)}
            >
              <span className="font-semibold">{ghost.timeLabel}</span>
              {ghost.problem && <span className="line-clamp-2">{ghost.problem}</span>}
            </div>
            {DragDebugOverlay && (
              <Suspense fallback={null}>
                <DragDebugOverlay info={ghost.debug} slot={ghost.slot} />
              </Suspense>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
