'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { usePresenceStore, type PresenceMember } from '@/stores/usePresenceStore';
import { getRoomMembers } from '@/actions/presence/getRoomMembers';

interface PresenceEvent {
  type: 'subscription_succeeded' | 'member_added' | 'member_removed' | 'subscription_error' | 'polling_fallback' | 'poll_update' | 'author_joined' | 'author_left';
  detail: string;
  memberId?: string;
}

interface AuthorJoinData {
  authorId: string;
  authorName: string;
}

interface UsePresenceChannelOptions {
  channelId: string | null;
  enabled?: boolean;
  pollingIntervalMs?: number;
  onEvent?: (event: PresenceEvent) => void;
  onAuthorJoin?: (data: AuthorJoinData) => void;
  onAuthorLeave?: (data: { authorId: string }) => void;
}

export function usePresenceChannel({
  channelId,
  enabled = true,
  pollingIntervalMs = 30000,
  onEvent,
  onAuthorJoin,
  onAuthorLeave,
}: UsePresenceChannelOptions) {
  const channelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof getPusherClient>>['subscribe']
  > | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onEventRef = useRef(onEvent);
  const onAuthorJoinRef = useRef(onAuthorJoin);
  const onAuthorLeaveRef = useRef(onAuthorLeave);

  useEffect(() => {
    onEventRef.current = onEvent;
    onAuthorJoinRef.current = onAuthorJoin;
    onAuthorLeaveRef.current = onAuthorLeave;
  });

  const {
    members,
    currentChannel,
    isConnected,
    connectionMode,
    joinChannel,
    leaveChannel,
    setMembers,
    addMember,
    removeMember,
    setConnectionMode,
  } = usePresenceStore();

  const startPolling = useCallback(
    (bookId: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);

      const poll = async () => {
        const result = await getRoomMembers(bookId);
        if (result.success) {
          const memberMap = new Map<string, PresenceMember>();
          for (const m of result.data) {
            memberMap.set(m.id, { id: m.id, name: m.name, avatarUrl: m.avatarUrl, isAuthor: m.isAuthor });
          }
          setMembers(memberMap);
          onEventRef.current?.({ type: 'poll_update', detail: `Polled ${result.data.length} members` });
        }
      };

      poll();
      pollingRef.current = setInterval(poll, pollingIntervalMs);
    },
    [pollingIntervalMs, setMembers]
  );

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!channelId || !enabled) return;

    const channelName = `presence-room-${channelId}`;
    const pusher = getPusherClient();

    if (!pusher) {
      joinChannel(channelName);
      setConnectionMode('polling');
      onEventRef.current?.({ type: 'polling_fallback', detail: 'Pusher not available, using polling' });
      startPolling(channelId);
      return () => {
        stopPolling();
        leaveChannel();
      };
    }

    try {
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;
      joinChannel(channelName);

      channel.bind(
        'pusher:subscription_succeeded',
        (data: { members: Record<string, { name: string; avatarUrl: string | null; isAuthor?: boolean }> }) => {
          const memberMap = new Map<string, PresenceMember>();
          for (const [id, info] of Object.entries(data.members)) {
            memberMap.set(id, { id, name: info.name, avatarUrl: info.avatarUrl, isAuthor: info.isAuthor ?? false });
          }
          setMembers(memberMap);
          setConnectionMode('realtime');
          onEventRef.current?.({
            type: 'subscription_succeeded',
            detail: `Subscribed with ${Object.keys(data.members).length} members`,
          });
        }
      );

      channel.bind(
        'pusher:member_added',
        (member: { id: string; info: { name: string; avatarUrl: string | null; isAuthor?: boolean } }) => {
          addMember({ id: member.id, name: member.info.name, avatarUrl: member.info.avatarUrl, isAuthor: member.info.isAuthor ?? false });
          onEventRef.current?.({
            type: 'member_added',
            detail: `${member.info.name} joined`,
            memberId: member.id,
          });
        }
      );

      channel.bind('pusher:member_removed', (member: { id: string }) => {
        // Check if the leaving member is an author before removing
        const leavingMember = usePresenceStore.getState().members.get(member.id);
        removeMember(member.id);
        onEventRef.current?.({
          type: 'member_removed',
          detail: `Member ${member.id} left`,
          memberId: member.id,
        });
        if (leavingMember?.isAuthor) {
          onEventRef.current?.({
            type: 'author_left',
            detail: `Author ${member.id} left`,
            memberId: member.id,
          });
          onAuthorLeaveRef.current?.({ authorId: member.id });
        }
      });

      channel.bind('room:author-joined', (data: AuthorJoinData) => {
        onEventRef.current?.({
          type: 'author_joined',
          detail: `${data.authorName} joined as author`,
          memberId: data.authorId,
        });
        onAuthorJoinRef.current?.(data);
      });

      channel.bind('pusher:subscription_error', () => {
        setConnectionMode('polling');
        onEventRef.current?.({ type: 'subscription_error', detail: 'Subscription failed, falling back to polling' });
        startPolling(channelId);
      });
    } catch {
      setConnectionMode('polling');
      onEventRef.current?.({ type: 'polling_fallback', detail: 'Pusher error, falling back to polling' });
      startPolling(channelId);
    }

    return () => {
      stopPolling();
      if (pusher && channelRef.current) {
        channelRef.current.unbind_all();
        pusher.unsubscribe(channelName);
      }
      channelRef.current = null;
      leaveChannel();
    };
  }, [
    channelId,
    enabled,
    joinChannel,
    leaveChannel,
    setMembers,
    addMember,
    removeMember,
    setConnectionMode,
    startPolling,
    stopPolling,
  ]);

  return {
    members,
    currentChannel,
    isConnected,
    connectionMode,
    memberCount: members.size,
  };
}

export type { PresenceEvent, AuthorJoinData };
