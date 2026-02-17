import { Skeleton } from '@/components/ui/skeleton';

export function ContinueReadingSkeleton() {
  return (
    <div data-testid="continue-reading-skeleton">
      <Skeleton className="mb-3 h-6 w-40" />
      <div className="space-y-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-lg p-3">
            <Skeleton className="h-[72px] w-[48px] flex-shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
