'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import { getPusher } from '@/lib/pusher-server';
import { liftSuspensionSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/actions/books/types';

export async function liftSuspension(
  input: unknown
): Promise<ActionResult<{ liftedAt: Date }>> {
  try {
    const validated = liftSuspensionSchema.parse(input);

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

    // Verify user is actually suspended
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, suspendedUntil: true },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    if (!targetUser.suspendedUntil || targetUser.suspendedUntil <= new Date()) {
      return { success: false, error: 'User is not currently suspended' };
    }

    const now = new Date();

    // Find the most recent active suspension
    const activeSuspension = await prisma.userSuspension.findFirst({
      where: { userId: validated.userId, liftedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    const operations = [
      // Clear user suspension fields
      prisma.user.update({
        where: { id: validated.userId },
        data: {
          suspendedUntil: null,
          suspensionReason: null,
        },
      }),
      // Log admin action
      prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          actionType: 'LIFT_SUSPENSION',
          targetId: validated.userId,
          targetType: 'User',
          details: {
            reason: validated.reason ?? null,
          } as object,
        },
      }),
    ];

    // Update suspension record if found
    if (activeSuspension) {
      operations.push(
        prisma.userSuspension.update({
          where: { id: activeSuspension.id },
          data: {
            liftedAt: now,
            liftedById: session.user.id,
          },
        }) as never
      );
    }

    await prisma.$transaction(operations);

    // Notify user
    try {
      const pusher = getPusher();
      await pusher?.trigger(
        `private-user-${validated.userId}`,
        'moderation:suspension-lifted',
        {}
      );
    } catch (pusherError) {
      console.error('Pusher trigger failed:', pusherError);
    }

    return { success: true, data: { liftedAt: now } };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('liftSuspension error:', error);
    return { success: false, error: 'Failed to lift suspension' };
  }
}
