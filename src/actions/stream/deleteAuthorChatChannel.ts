'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { getStreamServerClient } from '@/lib/stream';
import type { ActionResult } from '@/types';

export async function deleteAuthorChatChannel(
  channelId: string,
): Promise<ActionResult<void>> {
  try {
    if (!channelId || typeof channelId !== 'string') {
      return { success: false, error: 'Invalid channelId' };
    }

    // Only allow deletion of ephemeral author chat channels
    if (!channelId.startsWith('author-chat-')) {
      return { success: false, error: 'Invalid channel type for deletion' };
    }

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = getStreamServerClient();
    const channel = client.channel('messaging', channelId);
    await channel.delete();

    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete author chat channel:', error);
    return {
      success: false,
      error: 'Failed to delete author chat channel',
    };
  }
}
