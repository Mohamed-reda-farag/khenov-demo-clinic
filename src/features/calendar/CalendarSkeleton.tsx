import { Skeleton } from '@/components/ui/Skeleton';

const COLUMN_BLOCKS = [
  [12, 96],
  [140, 56],
  [250, 120],
  [400, 56],
];

export function CalendarSkeleton() {
  return (
    <div aria-busy className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-11 w-72" />
        <Skeleton className="h-11 w-96" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border border-line bg-surface">
        {Array.from({ length: 7 }, (_, column) => (
          <div key={column} className="relative border-line p-2">
            <Skeleton className="mx-auto h-8 w-16" />
            {COLUMN_BLOCKS.map(([top, height], index) => (
              <Skeleton
                key={top}
                className="absolute inset-x-2 opacity-60"
                // Deterministic pseudo-layout so every column looks different.
                {...{ style: { top: top + ((column * 37 + index * 23) % 60) + 48, height } }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
