'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BookDetailSkeletonProps {
  className?: string;
}

export function BookDetailSkeleton({ className }: BookDetailSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)} data-testid="book-detail-skeleton">
      {/* Hero section skeleton */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/50 to-transparent h-64 dark:from-amber-950/20" />
        <div className="relative z-10 flex flex-col items-center pt-6 pb-4">
          {/* Book cover skeleton */}
          <Skeleton className="w-40 h-56 rounded-lg mb-4" />

          {/* Title skeleton */}
          <Skeleton className="h-8 w-64 mb-2" />

          {/* Author skeleton */}
          <Skeleton className="h-5 w-40 mb-1" />

          {/* Metadata skeleton */}
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Readers count skeleton */}
      <div className="px-4 py-3 flex items-center gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Description skeleton */}
      <div className="px-4 py-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Actions skeleton */}
      <div className="px-4 py-4">
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}
