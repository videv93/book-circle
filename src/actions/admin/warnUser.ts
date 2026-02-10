'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { getPusher } from '@/lib/pusher-server';
import { warnUserSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/actions/books/types';
import type { UserWarning } from '@prisma/client';

export async function warnUser(
  input: unknown
): Promise<ActionResult<UserWarning>> {
  try {
    const validated = warnUserSchema.parse(input);

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

    // Prevent self-moderation
    if (validated.userId === session.user.id) {
      return { success: false, error: 'Cannot warn yourself' };
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { id: true },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Build transaction operations
    const operations = [
      prisma.userWarning.create({
        data: {
          userId: validated.userId,
          issuedById: session.user.id,
          warningType: validated.warningType,
          message: validated.message,
          moderationItemId: validated.moderationItemId ?? null,
        },
      }),
      prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          actionType: 'WARN_USER',
          targetId: validated.userId,
          targetType: 'User',
          details: {
            warningType: validated.warningType,
            message: validated.message,
            moderationItemId: validated.moderationItemId ?? null,
          } as object,
        },
      }),
    ];

    // Optionally update ModerationItem status
    if (validated.moderationItemId) {
      const moderationItem = await prisma.moderationItem.findUnique({
        where: { id: validated.moderationItemId },
        select: { reportedUserId: true },
      });

      if (moderationItem?.reportedUserId !== validated.userId) {
        return {
          success: false,
          error: 'Moderation item does not match target user',
        };
      }

      operations.push(
        prisma.moderationItem.update({
          where: { id: validated.moderationItemId },
          data: {
            status: 'WARNED',
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        }) as never
      );
    }

    const [warning] = await prisma.$transaction(operations);

    // Send notification to user
    try {
      const pusher = getPusher();
      await pusher?.trigger(
        `private-user-${validated.userId}`,
        'moderation:user-warned',
        {
          warningType: validated.warningType,
          message: validated.message,
        }
      );
    } catch (pusherError) {
      console.error('Pusher trigger failed:', pusherError);
    }

    return { success: true, data: warning as UserWarning };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('warnUser error:', error);
    return { success: false, error: 'Failed to warn user' };
  }
}
