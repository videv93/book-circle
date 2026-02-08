'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

export async function markActivityViewed(): Promise<
  ActionResult<{ success: true }>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastActivityViewedAt: new Date() },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('markActivityViewed error:', error);
    return { success: false, error: 'Failed to mark activity as viewed' };
  }
}
