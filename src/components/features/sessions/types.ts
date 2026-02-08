import type { ReadingStatus } from '@prisma/client';

export interface SessionTimerProps {
  bookId: string;
  bookTitle: string;
  bookStatus: ReadingStatus;
  userId?: string; // For offline queue and streak updates
  timezone?: string; // User's timezone for streak calculations
}

export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
