'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

const getFollowStatusSchema = z.object({
  targetUserId: z.string().min(1),
});

export type GetFollowStatusInput = z.input<typeof getFollowStatusSchema>;

export interface FollowStatusData {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
}

export async function getFollowStatus(
  input: GetFollowStatusInput
): Promise<ActionResult<FollowStatusData>> {
  try {
    const { targetUserId } = getFollowStatusSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [followRecord, followerCount, followingCount] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: targetUserId,
          },
        },
        select: { id: true },
      }),
      prisma.follow.count({
        where: { followingId: targetUserId },
      }),
      prisma.follow.count({
        where: { followerId: targetUserId },
      }),
    ]);

    return {
      success: true,
      data: {
        isFollowing: followRecord !== null,
        followerCount,
        followingCount,
      },
    };
  } catch {
    return { success: false, error: 'Failed to get follow status' };
  }
}
