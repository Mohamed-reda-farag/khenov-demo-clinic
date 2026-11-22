/**
 * Dev-only drag diagnostics: open the calendar with `?debug=drag` (development builds only; the
 * flag is a constant `false` in production, so the overlay is dropped from the bundle).
 * To remove it for good: delete this file, DragDebugOverlay.tsx and their two uses in CalendarGrid.tsx.
 */
export const DRAG_DEBUG: boolean =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === 'drag';

export interface DragDebugInfo {
  pointer: { x: number; y: number };
  offset: { x: number; y: number };
  ghostTop: number;
  columnIndex: number;
  startMin: number;
}
