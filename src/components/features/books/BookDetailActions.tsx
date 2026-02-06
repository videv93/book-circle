'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, CheckCircle, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { updateReadingStatus } from '@/actions/books';
import { AddToLibraryButton } from './AddToLibraryButton';
import { ReadingStatusSelector } from './ReadingStatusSelector';
import { getReadingStatusLabel } from './types';
import type { BookSearchResult } from '@/services/books/types';
import type { ReadingStatus } from '@prisma/client';

interface BookDetailActionsProps {
  book: BookSearchResult;
  isInLibrary: boolean;
  currentStatus?: ReadingStatus;
  progress?: number;
  userBookId?: string;
  onStatusChange?: (status: ReadingStatus) => void;
  className?: string;
}

function StatusIconComponent({ status }: { status: ReadingStatus }) {
  switch (status) {
    case 'CURRENTLY_READING':
      return <BookOpen className="h-5 w-5 text-amber-600" />;
    case 'FINISHED':
      return <CheckCircle className="h-5 w-5 text-amber-600" />;
    case 'WANT_TO_READ':
      return <BookMarked className="h-5 w-5 text-amber-600" />;
    default:
      return null;
  }
}

export function BookDetailActions({
  book,
  isInLibrary,
  currentStatus,
  progress = 0,
  userBookId,
  onStatusChange,
  className,
}: BookDetailActionsProps) {
  // Optimistic overlay: when set, overrides props. Cleared after server response.
  const [optimistic, setOptimistic] = useState<{
    status: ReadingStatus;
    progress: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Display values: optimistic overlay takes priority, then falls through to props
  const displayStatus = optimistic?.status ?? currentStatus;
  const displayProgress = optimistic?.progress ?? progress;

  // Clear optimistic overlay once props catch up
  useEffect(() => {
    if (optimistic && currentStatus === optimistic.status) {
      setOptimistic(null);
    }
  }, [currentStatus, optimistic]);

  if (!isInLibrary) {
    return (
      <div className={cn('px-4 py-4', className)} data-testid="add-to-library-section">
        <AddToLibraryButton
          book={book}
          isInLibrary={false}
          onStatusChange={onStatusChange}
          className="w-full h-12 text-base"
        />
      </div>
    );
  }

  const statusLabel = displayStatus ? getReadingStatusLabel(displayStatus) : '';

  const handleStatusUpdate = async (newStatus: ReadingStatus) => {
    if (newStatus === displayStatus || isUpdating) return;
    if (!userBookId) {
      toast.error('Unable to update status. Please try refreshing the page.');
      setPopoverOpen(false);
      return;
    }

    // Compute optimistic progress
    let newProgress = displayProgress;
    if (newStatus === 'FINISHED') {
      newProgress = 100;
    } else if (newStatus === 'WANT_TO_READ') {
      newProgress = 0;
    }

    // Set optimistic overlay (immediately visible)
    setOptimistic({ status: newStatus, progress: newProgress });
    setPopoverOpen(false);

    setIsUpdating(true);
    const result = await updateReadingStatus({
      userBookId,
      status: newStatus,
    });
    setIsUpdating(false);

    if (result.success) {
      toast.success(`Status updated to ${getReadingStatusLabel(newStatus)}`);
      onStatusChange?.(newStatus);
      // Keep optimistic overlay until parent props catch up
    } else {
      // Clear optimistic overlay - falls back to original prop values
      setOptimistic(null);
      toast.error(result.error);
    }
  };

  return (
    <div
      className={cn('px-4 py-4 space-y-4', className)}
      data-testid="library-status-section"
    >
      {/* Current status display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {displayStatus && <StatusIconComponent status={displayStatus} />}
          <span className="font-medium" data-testid="current-status">
            {statusLabel}
          </span>
        </div>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              data-testid="change-status-button"
              disabled={isUpdating}
            >
              Change status <ArrowRight className="h-3 w-3" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <ReadingStatusSelector
              value={displayStatus}
              onSelect={handleStatusUpdate}
              disabled={isUpdating}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Progress bar for currently reading */}
      {displayStatus === 'CURRENTLY_READING' && (
        <div className="space-y-1" data-testid="progress-section">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span data-testid="progress-value">{displayProgress}%</span>
          </div>
          <Progress value={displayProgress} className="h-2" />
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled
          data-testid="log-session-button"
        >
          Log Session
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled
          data-testid="update-progress-button"
        >
          Update Progress
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Session logging and progress updates coming in future updates
      </p>
    </div>
  );
}
