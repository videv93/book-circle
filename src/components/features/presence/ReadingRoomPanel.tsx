'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePresenceChannel } from '@/hooks/usePresenceChannel';
import { joinRoom, leaveRoom } from '@/actions/presence';
import { updatePresenceHeartbeat } from '@/actions/presence/updatePresenceHeartbeat';
import { PresenceAvatarStack } from './PresenceAvatarStack';
import { OccupantDetailSheet } from './OccupantDetailSheet';

interface ReadingRoomPanelProps {
  bookId: string;
  className?: string;
}

export function ReadingRoomPanel({ bookId, className }: ReadingRoomPanelProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { members, connectionMode, memberCount } = usePresenceChannel({
    channelId: isJoined ? bookId : null,
    enabled: isJoined,
  });

  // Heartbeat: update lastActiveAt every 5 minutes while joined
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      updatePresenceHeartbeat(bookId);
    }, 5 * 60 * 1000);
  }, [bookId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isJoined) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
    return stopHeartbeat;
  }, [isJoined, startHeartbeat, stopHeartbeat]);

  const handleJoin = async () => {
    setIsLoading(true);
    const result = await joinRoom(bookId);
    if (result.success) {
      setIsJoined(true);
    }
    setIsLoading(false);
  };

  const handleLeave = async () => {
    setIsLoading(true);
    const result = await leaveRoom(bookId);
    if (result.success) {
      setIsJoined(false);
    }
    setIsLoading(false);
  };

  const connectionIndicator = () => {
    if (!isJoined) return null;
    switch (connectionMode) {
      case 'realtime':
        return (
          <span className="flex items-center gap-1 text-xs text-green-600" data-testid="connection-live">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            Live
          </span>
        );
      case 'polling':
        return (
          <span className="flex items-center gap-1 text-xs text-amber-600" data-testid="connection-delayed">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Delayed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs text-gray-400" data-testid="connection-offline">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />
            Offline
          </span>
        );
    }
  };

  // Not joined state (preview)
  if (!isJoined) {
    return (
      <div
        className={cn(
          'rounded-lg border border-amber-200 bg-amber-50/50 p-3',
          className
        )}
        data-testid="reading-room-panel"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span className="text-sm font-medium text-amber-800">
              Reading Room
            </span>
          </div>
          <Button
            size="sm"
            className="h-9 min-w-[88px] bg-amber-600 hover:bg-amber-700 text-white"
            onClick={handleJoin}
            disabled={isLoading}
            data-testid="join-room-button"
            aria-label="Join reading room"
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </div>
    );
  }

  // Joined state
  const isSoleReader = memberCount <= 1;
  const showSheet = memberCount > 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50/50 p-3 space-y-2',
        className
      )}
      data-testid="reading-room-panel"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-600" aria-hidden="true" />
          <span className="text-sm font-medium text-amber-800">
            Reading Room
          </span>
          {connectionIndicator()}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 min-w-[88px] border-amber-300 text-amber-700 hover:bg-amber-100"
          onClick={handleLeave}
          disabled={isLoading}
          data-testid="leave-room-button"
          aria-label="Leave reading room"
        >
          {isLoading ? 'Leaving...' : 'Leave Room'}
        </Button>
      </div>

      {isSoleReader ? (
        <p
          className="text-sm text-amber-600 italic"
          data-testid="empty-room-message"
        >
          You&apos;re the first reader here!
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <PresenceAvatarStack
            members={members}
            onClick={() => setIsSheetOpen(true)}
            aria-expanded={isSheetOpen}
          />
          <span className="text-xs text-amber-600" data-testid="reader-count">
            {memberCount} {memberCount === 1 ? 'reader' : 'readers'}
          </span>
        </div>
      )}

      {showSheet && (
        <OccupantDetailSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          members={members}
        />
      )}
    </div>
  );
}
