import { describe, expect, it } from 'vitest';
import { ghostOrigin, grabOffset, snappedStartMinutes } from './drag';

const PX = 96 / 60;
const base = { pxPerMin: PX, stepMin: 15, durationMin: 30, totalMin: 720 };

describe('grab offset', () => {
  it('measures the pointer from the card corner and keeps the card under the pointer', () => {
    const card = { left: 300, top: 200 };
    const offset = grabOffset({ x: 340, y: 260 }, card);
    expect(offset).toEqual({ x: 40, y: 60 });
    // Pointer moves by (+25, -30): the ghost moves by the same amount.
    expect(ghostOrigin({ x: 365, y: 230 }, offset)).toEqual({ left: 325, top: 170 });
    // At pointerdown the ghost is exactly where the card was.
    expect(ghostOrigin({ x: 340, y: 260 }, offset)).toEqual(card);
  });

  it('works the same in RTL (physical coordinates, no mirroring needed)', () => {
    const offset = grabOffset({ x: 900, y: 120 }, { left: 800, top: 100 });
    expect(offset.x).toBe(100);
    expect(ghostOrigin({ x: 700, y: 120 }, offset).left).toBe(600);
  });
});

describe('snapped start from the ghost top edge', () => {
  it('snaps to the nearest quarter hour', () => {
    // 100px under the column top = 62.5 min -> 60 min.
    expect(snappedStartMinutes({ ...base, columnTop: 0, ghostTop: 100 })).toBe(60);
    // 110px = 68.75 min -> 75 min.
    expect(snappedStartMinutes({ ...base, columnTop: 0, ghostTop: 110 })).toBe(75);
  });

  it('uses the ghost top, not the pointer, so different grab points land on the same slot', () => {
    const columnTop = 50;
    const ghostTop = 50 + 60 * PX; // exactly 60 minutes in
    for (const grab of [0, 20, 70, 140]) {
      const pointerY = ghostTop + grab;
      const top = ghostOrigin({ x: 0, y: pointerY }, { x: 0, y: grab }).top;
      expect(snappedStartMinutes({ ...base, durationMin: 90, columnTop, ghostTop: top })).toBe(60);
    }
  });

  it('keeps the same pointer on the same slot when the grid scrolls by the same distance', () => {
    const pointerY = 400;
    const offset = 20;
    const before = snappedStartMinutes({ ...base, columnTop: 100, ghostTop: pointerY - offset });
    // Auto-scroll by 48px: the column moves up by 48px under a still pointer.
    const after = snappedStartMinutes({
      ...base,
      columnTop: 100 - 48,
      ghostTop: pointerY - offset,
    });
    expect(after - before).toBe(30); // 48px = 30 minutes
  });

  it('clamps to the grid, including tall cards near the bottom', () => {
    expect(snappedStartMinutes({ ...base, columnTop: 0, ghostTop: -500 })).toBe(0);
    expect(snappedStartMinutes({ ...base, columnTop: 0, ghostTop: 99_999 })).toBe(690);
    expect(snappedStartMinutes({ ...base, durationMin: 180, columnTop: 0, ghostTop: 99_999 })).toBe(
      540,
    );
  });
});

// --- Full drag resolution (M3.1b): one coordinate space, column from the ghost centre ---
import { columnIndexAt, resolveDrag, shiftRect, type Rect } from './drag';

const col = (left: number, top = 100): Rect => ({ left, top, width: 160, height: 1152 });
const LTR_COLUMNS = [0, 1, 2].map((i) => col(300 + i * 160));
const RTL_COLUMNS = [2, 1, 0].map((i) => col(300 + i * 160)); // first day on the right
const input = {
  card: { width: 150, height: 96 },
  pxPerMin: PX,
  stepMin: 15,
  durationMin: 60,
  totalMin: 720,
};

describe('resolveDrag', () => {
  it('keeps the ghost under the pointer when a tall card is grabbed at its bottom', () => {
    const offset = { x: 20, y: 90 }; // 6px above the card's bottom edge
    const result = resolveDrag({
      ...input,
      pointer: { x: 400, y: 500 },
      offset,
      columns: LTR_COLUMNS,
    })!;
    expect(result.ghost.top).toBe(500 - 90);
    expect(result.ghost.left).toBe(400 - 20);
    // The target time comes from the ghost TOP edge (410 - 100 = 310px = 193.75min -> 195), not the pointer.
    expect(result.startMin).toBe(195);
    // Taking the time from the pointer instead (400px = 250min) would have landed at 255.
    expect(result.startMin).not.toBe(255);
  });

  it('uses the ghost horizontal centre to pick the column, not the pointer', () => {
    // Grabbed 140px from the card's left edge: the pointer is in column 1 (460-620)
    // but the ghost (left 320..470, centre 395) is over column 0 (300-460).
    const result = resolveDrag({
      ...input,
      pointer: { x: 470, y: 300 },
      offset: { x: 140, y: 10 },
      columns: LTR_COLUMNS,
    })!;
    expect(result.columnIndex).toBe(0);
  });

  it('is the same in RTL (physical coordinates, first day on the right)', () => {
    const result = resolveDrag({
      ...input,
      pointer: { x: 470, y: 300 },
      offset: { x: 10, y: 10 }, // ghost 460..610, centre 535
      columns: RTL_COLUMNS, // physical order: [col at 620, col at 460, col at 300]
    })!;
    expect(result.columnIndex).toBe(1);
    expect(result.ghost.left).toBe(460);
  });

  it('follows a scrolled grid: columns shifted by the scroll distance, ghost unchanged', () => {
    const base = { ...input, pointer: { x: 420, y: 360 }, offset: { x: 10, y: 20 } };
    const still = resolveDrag({ ...base, columns: LTR_COLUMNS })!;
    expect(still.startMin).toBe(150); // (340 - 100) / 1.6
    // The grid auto-scrolled down by 144px and right by 160px since the columns were measured.
    const scrolled = LTR_COLUMNS.map((r) => shiftRect(r, { x: 160, y: 144 }));
    const after = resolveDrag({ ...base, columns: scrolled })!;
    expect(after.ghost).toEqual(still.ghost); // the ghost never moves with the scroll
    expect(after.startMin - still.startMin).toBe(90); // 144px = 90 minutes further down
    expect(after.columnIndex).toBe(still.columnIndex + 1); // the columns slid left under the ghost
  });

  it('shiftRect moves a rect against the scroll distance (also for negative RTL scroll)', () => {
    expect(shiftRect(col(300), { x: 50, y: 20 })).toMatchObject({ left: 250, top: 80 });
    expect(shiftRect(col(300), { x: -50, y: 0 })).toMatchObject({ left: 350, top: 100 });
  });

  it('falls back to the nearest column when the ghost is outside every column', () => {
    expect(columnIndexAt(LTR_COLUMNS, 10)).toBe(0);
    expect(columnIndexAt(LTR_COLUMNS, 9999)).toBe(2);
    expect(columnIndexAt([null, col(300)], 310)).toBe(1);
  });

  it('returns null when nothing is measured', () => {
    expect(
      resolveDrag({ ...input, pointer: { x: 0, y: 0 }, offset: { x: 0, y: 0 }, columns: [] }),
    ).toBeNull();
  });
});
