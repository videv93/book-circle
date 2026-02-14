'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
  defaultRenderMessages,
  isDateSeparatorMessage,
  isIntroMessage,
  getGroupStyles,
} from 'stream-chat-react';
import type { Channel as ChannelType } from 'stream-chat';
import type { GroupStyle, RenderMessagesOptions } from 'stream-chat-react';
import { getBookChannel } from '@/actions/stream';
import { useChatClient } from './useChatClient';
import { createDiscussionMessage } from './DiscussionMessage';

import 'stream-chat-react/dist/css/v2/index.css';

interface BookDiscussionProps {
  bookId: string;
  bookTitle: string;
  authorUserId?: string | null;
}

export function BookDiscussion({ bookId, bookTitle, authorUserId }: BookDiscussionProps) {
  const client = useChatClient();
  const pathname = usePathname();
  const CustomMessage = useMemo(() => createDiscussionMessage(authorUserId), [authorUserId]);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'recent' | 'active'>('recent');

  const activeRenderMessages = useCallback(
    (options: RenderMessagesOptions) => {
      const { messages, messageGroupStyles, ...rest } = options;

      // Filter out date separators and intro messages — they are positional
      // and meaningless after re-sorting by activity
      const realMessages = messages.filter(
        (m) => !isDateSeparatorMessage(m) && !isIntroMessage(m),
      );

      // Sort by thread activity (most recent activity first)
      const sorted = [...realMessages].sort((a, b) => {
        const aMsg = a as { reply_count?: number; created_at?: string; updated_at?: string };
        const bMsg = b as { reply_count?: number; created_at?: string; updated_at?: string };
        const aTime = (aMsg.reply_count ?? 0) > 0
          ? new Date(aMsg.updated_at ?? aMsg.created_at ?? 0).getTime()
          : new Date(aMsg.created_at ?? 0).getTime();
        const bTime = (bMsg.reply_count ?? 0) > 0
          ? new Date(bMsg.updated_at ?? bMsg.created_at ?? 0).getTime()
          : new Date(bMsg.created_at ?? 0).getTime();
        return bTime - aTime;
      });

      // Recalculate group styles for the new message order
      const newGroupStyles: Record<string, GroupStyle> = {};
      for (let i = 0; i < sorted.length; i++) {
        const msg = sorted[i];
        if ('id' in msg) {
          newGroupStyles[msg.id] = getGroupStyles(
            msg,
            sorted[i - 1] ?? ({} as never),
            sorted[i + 1] ?? ({} as never),
            false,
          );
        }
      }

      return defaultRenderMessages({
        messages: sorted,
        messageGroupStyles: newGroupStyles,
        ...rest,
      });
    },
    [],
  );

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let didCancel = false;

    async function initChannel() {
      try {
        const result = await getBookChannel({ bookId, bookTitle });
        if (didCancel) return;

        if (!result.success) {
          setError('Discussions unavailable');
          setLoading(false);
          return;
        }

        const ch = client!.channel('messaging', result.data.channelId);
        await ch.watch();

        if (!didCancel) {
          setChannel(ch);
          setLoading(false);
        }
      } catch {
        if (!didCancel) {
          setError('Discussions unavailable');
          setLoading(false);
        }
      }
    }

    initChannel();

    return () => {
      didCancel = true;
    };
  }, [client, bookId, bookTitle]);

  if (loading) {
    return (
      <div className="border-t border-border px-4 py-4" data-testid="discussion-loading">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussion</h3>
        <div className="space-y-3 animate-pulse">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-3/4 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated: show login prompt instead of error
  if (!client) {
    return (
      <div className="border-t border-border px-4 py-4" data-testid="discussion-login-prompt">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Discussion</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Join the conversation about this book.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground min-h-[44px] hover:bg-primary/90 transition-colors"
          aria-label="Log in to join the book discussion"
        >
          Log in to join the discussion
        </Link>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="border-t border-border px-4 py-4" data-testid="discussion-error">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Discussion</h3>
        <p className="text-sm text-muted-foreground">{error || 'Discussions unavailable'}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-border px-4 py-4" data-testid="book-discussion">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Discussion</h3>
      <div className="flex gap-1 mb-3" role="group" aria-label="Sort discussions" data-testid="sort-toggle">
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md min-h-[44px] transition-colors ${
            sortMode === 'recent'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          onClick={() => setSortMode('recent')}
          aria-pressed={sortMode === 'recent'}
        >
          Recent
        </button>
        <button
          className={`px-3 py-1.5 text-xs font-medium rounded-md min-h-[44px] transition-colors ${
            sortMode === 'active'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          onClick={() => setSortMode('active')}
          aria-pressed={sortMode === 'active'}
        >
          Active
        </button>
      </div>
      <div className="str-chat__discussion-wrapper">
        <Channel channel={channel} Message={CustomMessage}>
          <Window>
            <MessageList
              renderMessages={sortMode === 'active' ? activeRenderMessages : undefined}
            />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </div>
    </div>
  );
}
