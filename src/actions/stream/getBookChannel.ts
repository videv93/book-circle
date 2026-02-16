'use server';

import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { getStreamServerClient } from '@/lib/stream';
import type { ActionResult } from '@/types';

interface GetBookChannelInput {
  bookId: string;
}

export async function getBookChannel(
  input: GetBookChannelInput,
): Promise<ActionResult<{ channelId: string }>> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const client = getStreamServerClient();
    const channelId = `book-${input.bookId}`;
    const channel = client.channel('messaging', channelId);
    await channel.watch();

    return { success: true, data: { channelId } };
  } catch (error) {
    console.error('Failed to get or create book discussion channel:', error);
    return {
      success: false,
      error: 'Failed to get or create book discussion channel',
    };
  }
}
