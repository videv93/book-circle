'use client';

import { Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookReadersCountProps {
  totalReaders: number;
  currentlyReading: number;
  className?: string;
}

export function BookReadersCount({
  totalReaders,
  currentlyReading,
  className,
}: BookReadersCountProps) {
  if (totalReaders === 0) {
    return (
      <div className={cn('px-4 py-3', className)} data-testid="readers-empty">
        <p className="text-sm text-muted-foreground text-center">
          Be the first to add this book to your library!
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('px-4 py-3 flex items-center gap-4', className)}
      data-testid="readers-count"
    >
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span>
          <span className="font-medium">{totalReaders}</span>
          <span className="text-muted-foreground">
            {' '}
            {totalReaders === 1 ? 'reader' : 'readers'}
          </span>
        </span>
      </div>

      {currentlyReading > 0 && (
        <div
          className="flex items-center gap-2 text-sm"
          data-testid="currently-reading"
        >
          <BookOpen className="h-4 w-4 text-amber-600" aria-hidden />
          <span>
            <span className="font-medium text-amber-600">{currentlyReading}</span>
            <span className="text-muted-foreground"> currently reading</span>
          </span>
        </div>
      )}
    </div>
  );
}
