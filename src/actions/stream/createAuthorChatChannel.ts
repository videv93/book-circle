'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { getStreamServerClient } from '@/lib/stream';
import type { ActionResult } from '@/types';

export async function createAuthorChatChannel(
  bookId: string,
  authorUserId?: string,
): Promise<ActionResult<{ channelId: string }>> {
  try {
    if (!bookId || typeof bookId !== 'string') {
      return { success: false, error: 'Invalid bookId' };
    }

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const sessionId = crypto.randomUUID();
    const channelId = `author-chat-${bookId}-${sessionId}`;
    const client = getStreamServerClient();

    const members = [session.user.id];
    if (authorUserId && authorUserId !== session.user.id) {
      members.push(authorUserId);
    }

    const channel = client.channel('messaging', channelId, {
      created_by_id: session.user.id,
      members,
    });
    await channel.watch();

    return { success: true, data: { channelId } };
  } catch (error) {
    console.error('Failed to create author chat channel:', error);
    return {
      success: false,
      error: 'Failed to create author chat channel',
    };
  }
}
