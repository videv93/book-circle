'use client';

import { ArrowRight, BookOpen, CheckCircle, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AddToLibraryButton } from './AddToLibraryButton';
import { getReadingStatusLabel } from './types';
import type { BookSearchResult } from '@/services/books/types';
import type { ReadingStatus } from '@prisma/client';

interface BookDetailActionsProps {
  book: BookSearchResult;
  isInLibrary: boolean;
  currentStatus?: ReadingStatus;
  progress?: number;
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
  onStatusChange,
  className,
}: BookDetailActionsProps) {
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

  const statusLabel = currentStatus ? getReadingStatusLabel(currentStatus) : '';

  return (
    <div
      className={cn('px-4 py-4 space-y-4', className)}
      data-testid="library-status-section"
    >
      {/* Current status display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStatus && <StatusIconComponent status={currentStatus} />}
          <span className="font-medium" data-testid="current-status">
            {statusLabel}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          data-testid="change-status-button"
          disabled
        >
          Change status <ArrowRight className="h-3 w-3" aria-hidden />
        </Button>
      </div>

      {/* Progress bar for currently reading */}
      {currentStatus === 'CURRENTLY_READING' && (
        <div className="space-y-1" data-testid="progress-section">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span data-testid="progress-value">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
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
