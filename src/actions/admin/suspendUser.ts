'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { getPusher } from '@/lib/pusher-server';
import { suspendUserSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/actions/books/types';
import type { UserSuspension, SuspensionDuration } from '@prisma/client';

function calculateSuspendedUntil(duration: SuspensionDuration): Date {
  const now = new Date();
  switch (duration) {
    case 'HOURS_24':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'DAYS_7':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'DAYS_30':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'PERMANENT':
      return new Date('9999-12-31T23:59:59.999Z');
  }
}

export async function suspendUser(
  input: unknown
): Promise<ActionResult<UserSuspension>> {
  try {
    const validated = suspendUserSchema.parse(input);

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
      return { success: false, error: 'Cannot suspend yourself' };
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, suspendedUntil: true },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    // Check if already suspended
    if (
      targetUser.suspendedUntil &&
      targetUser.suspendedUntil > new Date()
    ) {
      return { success: false, error: 'User is already suspended' };
    }

    const suspendedUntil = calculateSuspendedUntil(
      validated.duration as SuspensionDuration
    );

    // Build transaction operations
    const operations = [
      // Create suspension record
      prisma.userSuspension.create({
        data: {
          userId: validated.userId,
          issuedById: session.user.id,
          reason: validated.reason,
          duration: validated.duration as SuspensionDuration,
          suspendedUntil,
          moderationItemId: validated.moderationItemId ?? null,
        },
      }),
      // Update user suspension fields
      prisma.user.update({
        where: { id: validated.userId },
        data: {
          suspendedUntil,
          suspensionReason: validated.reason,
        },
      }),
      // Delete all sessions (force logout)
      prisma.session.deleteMany({
        where: { userId: validated.userId },
      }),
      // Terminate all active room presences
      prisma.roomPresence.updateMany({
        where: { userId: validated.userId, leftAt: null },
        data: { leftAt: new Date() },
      }),
      // Log admin action
      prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          actionType: 'SUSPEND_USER',
          targetId: validated.userId,
          targetType: 'User',
          details: {
            duration: validated.duration,
            reason: validated.reason,
            suspendedUntil: suspendedUntil.toISOString(),
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
            status: 'SUSPENDED',
            reviewedById: session.user.id,
            reviewedAt: new Date(),
          },
        }) as never
      );
    }

    const [suspension] = await prisma.$transaction(operations);

    // Send notification to user
    try {
      const pusher = getPusher();
      await pusher?.trigger(
        `private-user-${validated.userId}`,
        'moderation:user-suspended',
        {
          reason: validated.reason,
          suspendedUntil: suspendedUntil.toISOString(),
          duration: validated.duration,
        }
      );
    } catch (pusherError) {
      console.error('Pusher trigger failed:', pusherError);
    }

    return { success: true, data: suspension as UserSuspension };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('suspendUser error:', error);
    return { success: false, error: 'Failed to suspend user' };
  }
}
