'use client';

import { useContext } from 'react';
import { ChatContext } from 'stream-chat-react';
import type { StreamChat } from 'stream-chat';

/**
 * Safely access the Stream Chat client from context.
 * Returns null when StreamChatProvider hasn't wrapped with <Chat> (unauthenticated users).
 */
export function useChatClient(): StreamChat | null {
  const context = useContext(ChatContext);
  return context?.client ?? null;
}
