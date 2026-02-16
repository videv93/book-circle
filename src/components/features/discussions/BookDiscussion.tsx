'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Channel,
  MessageInput,
  MessageList,
  Window,
} from 'stream-chat-react';
import type { Channel as ChannelType } from 'stream-chat';
import { getBookChannel } from '@/actions/stream';
import { useChatClient } from './useChatClient';
import { createDiscussionMessage } from './DiscussionMessage';

import 'stream-chat-react/dist/css/v2/index.css';

interface BookDiscussionProps {
  bookId: string;
  authorUserId?: string | null;
}

export function BookDiscussion({ bookId, authorUserId }: BookDiscussionProps) {
  const client = useChatClient();
  const pathname = usePathname();
  const CustomMessage = useMemo(() => createDiscussionMessage(authorUserId), [authorUserId]);
  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let didCancel = false;

    async function initChannel() {
      try {
        const result = await getBookChannel({ bookId });
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
  }, [client, bookId]);

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
      <div className="str-chat__discussion-wrapper">
        <Channel channel={channel} Message={CustomMessage}>
          <Window>
            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </div>
    </div>
  );
}
