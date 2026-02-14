'use client';

import { MessageSimple, useMessageContext } from 'stream-chat-react';

/**
 * Custom message component that highlights messages from verified book authors.
 * Wraps Stream's default MessageSimple with an author badge when applicable.
 */
export function createDiscussionMessage(authorUserId?: string | null) {
  return function DiscussionMessage() {
    const { message } = useMessageContext();
    const isAuthor = authorUserId && message.user?.id === authorUserId;

    if (isAuthor) {
      return (
        <div className="relative" data-testid="author-message">
          <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-amber-400 rounded-full" />
          <div className="pl-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Author
              </span>
            </div>
            <MessageSimple />
          </div>
        </div>
      );
    }

    return <MessageSimple />;
  };
}
