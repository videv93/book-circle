'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const getKudosForSessionSchema = z.object({
  sessionId: z.string().min(1),
});

export type GetKudosForSessionInput = z.infer<typeof getKudosForSessionSchema>;

export type KudosForSessionData = {
  totalKudos: number;
  userGaveKudos: boolean;
};

export async function getKudosForSession(
  input: GetKudosForSessionInput
): Promise<ActionResult<KudosForSessionData>> {
  try {
    const { sessionId } = getKudosForSessionSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [totalKudos, userKudos] = await Promise.all([
      prisma.kudos.count({
        where: { sessionId },
      }),
      prisma.kudos.findUnique({
        where: {
          giverId_sessionId: {
            giverId: session.user.id,
            sessionId,
          },
        },
        select: { id: true },
      }),
    ]);

    return {
      success: true,
      data: {
        totalKudos,
        userGaveKudos: userKudos !== null,
      },
    };
  } catch (error) {
    console.error('getKudosForSession error:', error);
    return { success: false, error: 'Failed to get kudos' };
  }
}
