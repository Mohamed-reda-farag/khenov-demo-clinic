import type { DragDebugInfo } from './dragDebug';

interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Draws what the drag math decided, in the same viewport space as the ghost: the pointer point
 * (red), the ghost's top edge (magenta line) and the computed target slot (green outline).
 * The red dot must sit exactly on the grabbed point of the ghost card.
 */
export default function DragDebugOverlay({ info, slot }: { info: DragDebugInfo; slot: Box }) {
  const { pointer, offset, ghostTop, columnIndex, startMin } = info;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]" data-drag-debug>
      <div
        className="absolute h-px w-full bg-[#d6249f]"
        style={{ transform: `translateY(${ghostTop}px)` }}
      />
      <div
        className="absolute size-3 rounded-full border-2 border-white bg-[#e11d1d]"
        style={{ transform: `translate(${pointer.x - 6}px, ${pointer.y - 6}px)` }}
      />
      <div
        className="absolute border-2 border-[#12a150]"
        style={{
          width: slot.width,
          height: slot.height,
          transform: `translate(${slot.left}px, ${slot.top}px)`,
        }}
      />
      <pre
        dir="ltr"
        className="absolute bottom-2 left-2 rounded bg-black/80 p-2 text-[11px] leading-4 text-white"
      >
        {`pointer  ${Math.round(pointer.x)}, ${Math.round(pointer.y)}
grab     ${Math.round(offset.x)}, ${Math.round(offset.y)}
ghostTop ${Math.round(ghostTop)}  (pointerY - grabY)
column   ${columnIndex}   start +${startMin} min`}
      </pre>
    </div>
  );
}
