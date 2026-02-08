'use client';

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { saveReadingSession } from '@/actions/sessions';

/**
 * Hook that syncs offline-queued reading sessions when the browser comes back online.
 * Mount this in AppShell or root layout so it runs app-wide.
 * Includes debouncing to prevent concurrent sync attempts and improved error handling.
 */
export function useOfflineSync() {
  const pendingSessions = useOfflineStore((s) => s.pendingSessions);
  const removeSession = useOfflineStore((s) => s.removeSession);
  const hasHydrated = useOfflineStore((s) => s._hasHydrated);

  // Prevent concurrent sync calls with a locking mechanism
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const syncSessions = useCallback(async () => {
    // Prevent concurrent syncs
    if (isSyncingRef.current || !hasHydrated || pendingSessions.length === 0) return;

    isSyncingRef.current = true;
    let synced = 0;
    const failed: string[] = [];

    // Process from last to first so index removal is safe
    for (let i = pendingSessions.length - 1; i >= 0; i--) {
      const session = pendingSessions[i];
      try {
        const result = await saveReadingSession({
          bookId: session.bookId,
          duration: session.duration,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          timezone: 'UTC', // Use default timezone from server
        });

        if (result.success) {
          removeSession(i);
          synced++;
        } else {
          // Track failed sessions for user feedback
          failed.push(`${session.bookId}: ${result.error}`);
        }
      } catch (error) {
        // Catch network or unexpected errors
        failed.push(`${session.bookId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    isSyncingRef.current = false;

    // Provide detailed feedback to user
    if (synced > 0 && failed.length === 0) {
      toast.success(
        `${synced} offline session${synced > 1 ? 's' : ''} synced!`
      );
    } else if (synced > 0 && failed.length > 0) {
      toast.success(`${synced} session${synced > 1 ? 's' : ''} synced, ${failed.length} failed`);
    } else if (failed.length > 0) {
      toast.error(`Failed to sync ${failed.length} session${failed.length > 1 ? 's' : ''}`);
    }
  }, [hasHydrated, pendingSessions, removeSession]);

  useEffect(() => {
    // Sync on mount if online and has pending sessions
    if (navigator.onLine && pendingSessions.length > 0) {
      syncSessions();
    }

    const handleOnline = () => {
      // Debounce the online event to prevent multiple calls
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(syncSessions, 500);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncSessions, pendingSessions.length]);
}
