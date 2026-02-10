'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';

export interface UserModerationHistoryResult {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    suspendedUntil: Date | null;
    suspensionReason: string | null;
    createdAt: Date;
  };
  warnings: Array<{
    id: string;
    warningType: string;
    message: string;
    acknowledgedAt: Date | null;
    createdAt: Date;
    issuedBy: { id: string; name: string | null };
  }>;
  suspensions: Array<{
    id: string;
    reason: string;
    duration: string;
    suspendedUntil: Date;
    liftedAt: Date | null;
    createdAt: Date;
    issuedBy: { id: string; name: string | null };
    liftedBy: { id: string; name: string | null } | null;
  }>;
  contentRemovals: Array<{
    id: string;
    violationType: string;
    adminNotes: string | null;
    removedAt: Date;
    restoredAt: Date | null;
  }>;
  flagCount: number;
}

export async function getUserModerationHistory(
  userId: string
): Promise<ActionResult<UserModerationHistoryResult>> {
  try {
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'User ID is required' };
    }

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!adminUser || !isAdmin(adminUser)) {
      return { success: false, error: 'Forbidden' };
    }

    const [user, warnings, suspensions, contentRemovals, flagCount] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            suspendedUntil: true,
            suspensionReason: true,
            createdAt: true,
          },
        }),
        prisma.userWarning.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: { issuedBy: { select: { id: true, name: true } } },
        }),
        prisma.userSuspension.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          include: {
            issuedBy: { select: { id: true, name: true } },
            liftedBy: { select: { id: true, name: true } },
          },
        }),
        prisma.contentRemoval.findMany({
          where: {
            moderationItem: { reportedUserId: userId },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            violationType: true,
            adminNotes: true,
            removedAt: true,
            restoredAt: true,
          },
        }),
        prisma.moderationItem.count({
          where: { reportedUserId: userId },
        }),
      ]);

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    return {
      success: true,
      data: {
        user,
        warnings,
        suspensions,
        contentRemovals,
        flagCount,
      },
    };
  } catch (error) {
    console.error('getUserModerationHistory error:', error);
    return { success: false, error: 'Failed to fetch moderation history' };
  }
}
