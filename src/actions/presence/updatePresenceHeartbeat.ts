'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const heartbeatSchema = z.object({
  bookId: z.string().min(1),
});

export async function updatePresenceHeartbeat(
  bookId: string
): Promise<ActionResult<{ updated: boolean }>> {
  try {
    const validated = heartbeatSchema.parse({ bookId });

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const result = await prisma.roomPresence.updateMany({
      where: {
        userId: session.user.id,
        bookId: validated.bookId,
        leftAt: null,
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    return { success: true, data: { updated: result.count > 0 } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid book ID' };
    }
    return { success: false, error: 'Failed to update presence heartbeat' };
  }
}
