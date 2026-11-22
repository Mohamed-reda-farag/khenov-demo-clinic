import { snapMinutes } from './time';

export interface Point {
  x: number;
  y: number;
}

/** Where the pointer grabbed the card, measured from the card's top-left corner. */
export function grabOffset(pointer: Point, card: { left: number; top: number }): Point {
  return { x: pointer.x - card.left, y: pointer.y - card.top };
}

/** Top-left corner of the ghost: the card stays under the pointer at the exact grabbed point. */
export function ghostOrigin(pointer: Point, offset: Point): { left: number; top: number } {
  return { left: pointer.x - offset.x, top: pointer.y - offset.y };
}

export interface SnapInput {
  /** Top edge of the ghost (viewport px). */
  ghostTop: number;
  /** Top edge of the column the ghost is over (viewport px, already corrected for scrolling). */
  columnTop: number;
  pxPerMin: number;
  stepMin: number;
  durationMin: number;
  /** Minutes in the whole grid. */
  totalMin: number;
}

/**
 * The snapped start (minutes from the top of the grid) for a ghost, taken from the ghost's TOP edge,
 * so a tall card grabbed near its bottom still lands where its top edge is.
 */
export function snappedStartMinutes(input: SnapInput): number {
  const raw = (input.ghostTop - input.columnTop) / input.pxPerMin;
  const latest = Math.max(0, input.totalMin - input.durationMin);
  return Math.min(latest, Math.max(0, snapMinutes(raw, input.stepMin)));
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A measured rectangle after the scroller moved by `scrolled` since it was measured. Content moves
 * against the scroll, so a rect shifts by minus the distance (this also holds for the negative
 * scrollLeft of RTL scrollers).
 */
export function shiftRect(rect: Rect, scrolled: Point): Rect {
  return { ...rect, left: rect.left - scrolled.x, top: rect.top - scrolled.y };
}

/** The column containing `x`, or the nearest one when `x` is outside all of them (-1 if none measured). */
export function columnIndexAt(columns: ReadonlyArray<Rect | null>, x: number): number {
  const inside = columns.findIndex((r) => r && x >= r.left && x <= r.left + r.width);
  if (inside !== -1) return inside;
  const distance = (r: Rect | null) =>
    r ? Math.min(Math.abs(x - r.left), Math.abs(x - (r.left + r.width))) : Infinity;
  let best = -1;
  columns.forEach((r, i) => {
    if (r && (best === -1 || distance(r) < distance(columns[best] ?? null))) best = i;
  });
  return best;
}

export interface DragInput {
  /** Pointer position in viewport px (clientX / clientY). */
  pointer: Point;
  /** `grabOffset` measured at pointerdown. */
  offset: Point;
  /** Size of the card when it was grabbed. */
  card: { width: number; height: number };
  /** Column rectangles in viewport px, already corrected for scrolling (`shiftRect`). */
  columns: ReadonlyArray<Rect | null>;
  pxPerMin: number;
  stepMin: number;
  durationMin: number;
  totalMin: number;
}

export interface DragResult {
  /** The card, glued to the pointer at the grabbed point (viewport px). */
  ghost: Rect;
  columnIndex: number;
  /** Snapped start, in minutes from the top of the grid. */
  startMin: number;
}

/**
 * Everything is in ONE space: viewport pixels, exactly what pointer events and getBoundingClientRect
 * give. The ghost sits at `pointer - offset`; the column is the one under the ghost's horizontal
 * centre; the time comes from the ghost's TOP edge.
 */
export function resolveDrag(input: DragInput): DragResult | null {
  const { left, top } = ghostOrigin(input.pointer, input.offset);
  const ghost: Rect = { left, top, width: input.card.width, height: input.card.height };
  const columnIndex = columnIndexAt(input.columns, left + ghost.width / 2);
  const column = input.columns[columnIndex];
  if (columnIndex === -1 || !column) return null;
  const startMin = snappedStartMinutes({
    ghostTop: top,
    columnTop: column.top,
    pxPerMin: input.pxPerMin,
    stepMin: input.stepMin,
    durationMin: input.durationMin,
    totalMin: input.totalMin,
  });
  return { ghost, columnIndex, startMin };
}
