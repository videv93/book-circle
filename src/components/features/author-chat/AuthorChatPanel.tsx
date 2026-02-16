'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Channel,
  MessageInput,
  MessageList,
  Window,
} from 'stream-chat-react';
import type { Channel as ChannelType } from 'stream-chat';
import { MessageCircle } from 'lucide-react';
import {
  createAuthorChatChannel,
  getAuthorChatAccess,
  deleteAuthorChatChannel,
} from '@/actions/stream';
import { useChatClient } from '@/components/features/discussions/useChatClient';
import { createDiscussionMessage } from '@/components/features/discussions/DiscussionMessage';
import { AuthorChatLockedOverlay } from './AuthorChatLockedOverlay';

const CHAT_ENDED_DISMISS_MS = 7_000;

interface AuthorChatPanelProps {
  bookId: string;
  authorPresent: boolean;
  authorUserId?: string;
  authorName?: string;
  onChannelCreated?: (channelId: string) => void;
  onChannelCleanup?: () => void;
}

export function AuthorChatPanel({
  bookId,
  authorPresent,
  authorUserId,
  authorName,
  onChannelCreated,
  onChannelCleanup,
}: AuthorChatPanelProps) {
  const client = useChatClient();
  const clientRef = useRef(client);
  clientRef.current = client;
  const shouldReduceMotion = useReducedMotion();
  const CustomMessage = useMemo(
    () => createDiscussionMessage(authorUserId),
    [authorUserId],
  );
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<boolean | null>(null);
  const [chatEnded, setChatEnded] = useState(false);
  const channelIdRef = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadChannelRef = useRef(false);

  // Track whether we had an active channel (for detecting author leave with active chat)
  useEffect(() => {
    if (channel) {
      hadChannelRef.current = true;
    }
  }, [channel]);

  // Check premium status when author becomes present
  useEffect(() => {
    if (!authorPresent) {
      return;
    }

    let didCancel = false;

    async function checkAccess() {
      const result = await getAuthorChatAccess();
      if (didCancel) return;
      if (result.success) {
        setPremiumStatus(result.data.isPremium);
      } else {
        setError('Chat unavailable');
      }
    }

    checkAccess();

    return () => {
      didCancel = true;
    };
  }, [authorPresent]);

  // Poll for premium status change when free user sees locked overlay
  useEffect(() => {
    if (!authorPresent || premiumStatus !== false) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    const checkUpgrade = async () => {
      const result = await getAuthorChatAccess();
      if (result.success && result.data.isPremium) {
        setPremiumStatus(true);
      }
    };

    pollRef.current = setInterval(checkUpgrade, 30_000);

    const handleFocus = () => {
      checkUpgrade();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [authorPresent, premiumStatus]);

  // Initialize chat channel for premium users only
  const initChat = useCallback(async () => {
    const currentClient = clientRef.current;
    if (!currentClient) {
      setError('Chat unavailable');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let targetChannelId = channelIdRef.current;

      if (!targetChannelId) {
        const result = await createAuthorChatChannel(bookId, authorUserId);

        if (!result.success) {
          setError('Chat unavailable');
          setLoading(false);
          return;
        }
        targetChannelId = result.data.channelId;
        channelIdRef.current = targetChannelId;
        onChannelCreated?.(targetChannelId);
      }

      const ch = currentClient.channel('messaging', targetChannelId);
      await ch.watch();

      setChannel(ch);
      setLoading(false);
    } catch {
      setError('Chat unavailable');
      setLoading(false);
    }
  }, [bookId, authorUserId, onChannelCreated]);

  // Cleanup: delete the ephemeral channel and reset refs
  const cleanupChannel = useCallback(async () => {
    const channelId = channelIdRef.current;
    if (channelId) {
      channelIdRef.current = null;
      await deleteAuthorChatChannel(channelId).catch(() => {});
    }
    hadChannelRef.current = false;
    onChannelCleanup?.();
  }, [onChannelCleanup]);

  // Handle author presence changes — enter "chat ended" state or connect
  useEffect(() => {
    if (!authorPresent) {
      // Author left — if we had an active channel, show "chat ended" message
      if (hadChannelRef.current && channelIdRef.current) {
        setChannel(null);
        setError(null);
        setLoading(false);
        setPremiumStatus(null);
        setChatEnded(true);

        // Auto-dismiss after delay, then cleanup
        dismissTimerRef.current = setTimeout(async () => {
          setChatEnded(false);
          await cleanupChannel();
        }, CHAT_ENDED_DISMISS_MS);
      } else {
        // No active chat — just reset
        setChannel(null);
        setError(null);
        setLoading(false);
        setPremiumStatus(null);
      }
      return;
    }

    // Author present — reset ended state if re-entering
    setChatEnded(false);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Only connect premium users to the Stream channel
    if (premiumStatus !== true) {
      return;
    }

    let didCancel = false;

    (async () => {
      await initChat();
      if (didCancel) {
        setChannel(null);
      }
    })();

    return () => {
      didCancel = true;
    };
  }, [authorPresent, premiumStatus, initChat, cleanupChannel]);

  // Cleanup dismiss timer on unmount
  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  if (!authorPresent && !chatEnded) return null;

  return (
    <AnimatePresence>
      {(authorPresent || chatEnded) && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
          className="mt-3 rounded-lg border border-amber-300 bg-amber-50/30 overflow-hidden"
          data-testid="author-chat-panel"
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-200 bg-amber-50/50">
            <MessageCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span className="text-sm font-medium text-amber-800">
              Chat with {authorName || 'the Author'}
            </span>
          </div>

          {/* Chat ended state */}
          {chatEnded && (
            <div
              className="px-3 py-4 text-sm text-amber-700"
              data-testid="author-chat-ended"
              role="status"
              aria-live="polite"
            >
              Author has left — chat ended
            </div>
          )}

          {/* Premium status still loading */}
          {!chatEnded && premiumStatus === null && !error && (
            <div className="px-3 py-4 text-sm text-amber-600" data-testid="author-chat-loading">
              Connecting to chat...
            </div>
          )}

          {/* Access check failed */}
          {!chatEnded && premiumStatus === null && error && (
            <div className="px-3 py-4 text-sm text-muted-foreground" data-testid="author-chat-error">
              {error}
            </div>
          )}

          {/* Free user: show locked overlay */}
          {!chatEnded && premiumStatus === false && (
            <AuthorChatLockedOverlay authorName={authorName} />
          )}

          {/* Premium user: show chat */}
          {!chatEnded && premiumStatus === true && loading && (
            <div className="px-3 py-4 text-sm text-amber-600" data-testid="author-chat-loading">
              Connecting to chat...
            </div>
          )}

          {!chatEnded && premiumStatus === true && error && (
            <div className="px-3 py-4 text-sm text-muted-foreground" data-testid="author-chat-error">
              {error}
            </div>
          )}

          {!chatEnded && premiumStatus === true && channel && !error && !loading && (
            <div className="str-chat__author-chat-wrapper max-h-[300px] overflow-y-auto">
              <Channel channel={channel} Message={CustomMessage}>
                <Window>
                  <MessageList />
                  <MessageInput />
                </Window>
              </Channel>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
