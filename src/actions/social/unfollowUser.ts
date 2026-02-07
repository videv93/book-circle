'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const unfollowUserSchema = z.object({
  targetUserId: z.string().min(1),
});

export type UnfollowUserInput = z.input<typeof unfollowUserSchema>;

export async function unfollowUser(
  input: UnfollowUserInput
): Promise<ActionResult<{ unfollowed: boolean }>> {
  try {
    const { targetUserId } = unfollowUserSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    return { success: true, data: { unfollowed: true } };
  } catch (error) {
    // Handle Prisma "record not found" (P2025) = not following
    if (
      error instanceof Error &&
      'code' in error &&
      (error as unknown as { code: string }).code === 'P2025'
    ) {
      return { success: true, data: { unfollowed: true } };
    }
    return { success: false, error: 'Failed to unfollow user' };
  }
}
