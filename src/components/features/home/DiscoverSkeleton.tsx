import { Skeleton } from '@/components/ui/skeleton';

export function DiscoverSkeleton() {
  return (
    <div data-testid="discover-skeleton">
      <Skeleton className="mb-2 h-6 w-24" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-[130px] flex-shrink-0 rounded-xl border p-2">
            <Skeleton className="mx-auto h-[100px] w-[68px] rounded-md" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1 h-2.5 w-2/3" />
            <Skeleton className="mt-1 h-2.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
