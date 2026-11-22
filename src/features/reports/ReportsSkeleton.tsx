import { Skeleton } from '@/components/ui/Skeleton';

/** `embedded`: only the KPI and chart blocks (the page header is already on screen). */
export function ReportsSkeleton({ embedded = false }: { embedded?: boolean }) {
  const blocks = (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-72" />
        ))}
      </div>
    </>
  );
  if (embedded) {
    return (
      <div className="flex flex-col gap-6" aria-busy>
        {blocks}
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6" aria-busy>
      <Skeleton className="h-12 w-64" />
      {blocks}
    </div>
  );
}
