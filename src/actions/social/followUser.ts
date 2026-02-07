'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const followUserSchema = z.object({
  targetUserId: z.string().min(1),
});

export type FollowUserInput = z.input<typeof followUserSchema>;

export async function followUser(
  input: FollowUserInput
): Promise<ActionResult<{ followId: string }>> {
  try {
    const { targetUserId } = followUserSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (session.user.id === targetUserId) {
      return { success: false, error: 'Cannot follow yourself' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    try {
      const follow = await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      });

      return { success: true, data: { followId: follow.id } };
    } catch (createError) {
      // Handle Prisma unique constraint violation (P2002) = already following
      if (
        createError instanceof Error &&
        'code' in createError &&
        (createError as unknown as { code: string }).code === 'P2002'
      ) {
        const existing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: session.user.id,
              followingId: targetUserId,
            },
          },
          select: { id: true },
        });
        return { success: true, data: { followId: existing?.id ?? 'existing' } };
      }
      throw createError;
    }
  } catch {
    return { success: false, error: 'Failed to follow user' };
  }
}
