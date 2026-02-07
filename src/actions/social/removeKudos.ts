'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const removeKudosSchema = z.object({
  sessionId: z.string().min(1),
  targetUserId: z.string().min(1),
});

export type RemoveKudosInput = z.infer<typeof removeKudosSchema>;

export type RemoveKudosData = {
  totalKudos: number;
};

export async function removeKudos(
  input: RemoveKudosInput
): Promise<ActionResult<RemoveKudosData>> {
  try {
    const { sessionId, targetUserId } = removeKudosSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify session exists and belongs to target user
    const readingSession = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true },
    });
    if (!readingSession) {
      return { success: false, error: 'Session not found' };
    }
    if (readingSession.userId !== targetUserId) {
      return { success: false, error: 'Session does not belong to target user' };
    }

    // Try to delete the kudos record
    try {
      await prisma.kudos.delete({
        where: {
          giverId_sessionId: {
            giverId: session.user.id,
            sessionId,
          },
        },
      });
    } catch (deleteError) {
      // Handle P2025 = record not found (already deleted) - idempotent
      if (
        deleteError instanceof Error &&
        'code' in deleteError &&
        (deleteError as unknown as { code: string }).code === 'P2025'
      ) {
        // Record doesn't exist, that's fine - idempotent behavior
      } else {
        throw deleteError;
      }
    }

    // Get remaining kudos count for this session
    const totalKudos = await prisma.kudos.count({
      where: { sessionId },
    });

    return { success: true, data: { totalKudos } };
  } catch (error) {
    console.error('removeKudos error:', error);
    return { success: false, error: 'Failed to remove kudos' };
  }
}
