'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

export type UnreadKudosCountData = {
  count: number;
};

export async function getUnreadKudosCount(): Promise<
  ActionResult<UnreadKudosCountData>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { lastActivityViewedAt: true },
    });

    const count = await prisma.kudos.count({
      where: {
        receiverId: session.user.id,
        createdAt: {
          gt: user?.lastActivityViewedAt ?? new Date(0),
        },
      },
    });

    return { success: true, data: { count } };
  } catch (error) {
    console.error('getUnreadKudosCount error:', error);
    return { success: false, error: 'Failed to get unread kudos count' };
  }
}
