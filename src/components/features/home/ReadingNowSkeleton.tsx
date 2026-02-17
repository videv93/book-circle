import { Skeleton } from '@/components/ui/skeleton';

export function ReadingNowSkeleton() {
  return (
    <div data-testid="reading-now-skeleton">
      <Skeleton className="mb-2 h-6 w-32" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-[140px] flex-shrink-0 rounded-xl border p-2">
            <Skeleton className="mx-auto h-[100px] w-[68px] rounded-md" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1 h-2.5 w-2/3" />
            <Skeleton className="mt-1 h-2.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
