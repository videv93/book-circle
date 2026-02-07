'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const giveKudosSchema = z.object({
  sessionId: z.string().min(1),
  targetUserId: z.string().min(1),
});

export type GiveKudosInput = z.infer<typeof giveKudosSchema>;

export type GiveKudosData = {
  kudosId: string;
  totalKudos: number;
};

export async function giveKudos(
  input: GiveKudosInput
): Promise<ActionResult<GiveKudosData>> {
  try {
    const { sessionId, targetUserId } = giveKudosSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Prevent self-kudos
    if (session.user.id === targetUserId) {
      return { success: false, error: 'Cannot give kudos to yourself' };
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

    try {
      const kudos = await prisma.kudos.create({
        data: {
          giverId: session.user.id,
          receiverId: targetUserId,
          sessionId,
        },
      });

      const totalKudos = await prisma.kudos.count({
        where: { sessionId },
      });

      return { success: true, data: { kudosId: kudos.id, totalKudos } };
    } catch (createError) {
      // Handle P2002 unique constraint violation = already gave kudos
      if (
        createError instanceof Error &&
        'code' in createError &&
        (createError as unknown as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.kudos.findUnique({
          where: {
            giverId_sessionId: {
              giverId: session.user.id,
              sessionId,
            },
          },
          select: { id: true },
        });
        const totalKudos = await prisma.kudos.count({
          where: { sessionId },
        });
        return {
          success: true,
          data: { kudosId: existing?.id ?? 'existing', totalKudos },
        };
      }
      throw createError;
    }
  } catch (error) {
    console.error('giveKudos error:', error);
    return { success: false, error: 'Failed to give kudos' };
  }
}
