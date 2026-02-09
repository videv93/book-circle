'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/admin';
import { promoteUserSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/actions/books/types';

interface PromoteUserResult {
  userId: string;
  newRole: string;
  previousRole: string;
}

export async function promoteUser(
  input: unknown
): Promise<ActionResult<PromoteUserResult>> {
  try {
    const validated = promoteUserSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only super-admins can promote users
    const callerUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });

    if (!callerUser || !isSuperAdmin(callerUser)) {
      return { success: false, error: 'Only super-admins can change user roles' };
    }

    // Cannot change own role
    if (validated.userId === session.user.id) {
      return { success: false, error: 'Cannot change your own role' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return { success: false, error: 'User not found' };
    }

    const previousRole = targetUser.role;

    // Cannot demote another super-admin
    if (targetUser.role === 'SUPER_ADMIN') {
      return { success: false, error: 'Cannot change role of another super-admin' };
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: validated.userId },
        data: { role: validated.newRole },
        select: { id: true, role: true },
      }),
      prisma.adminAction.create({
        data: {
          adminId: session.user.id,
          actionType: 'PROMOTE_USER',
          targetId: validated.userId,
          targetType: 'User',
          details: {
            previousRole,
            newRole: validated.newRole,
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        userId: updatedUser.id,
        newRole: updatedUser.role,
        previousRole,
      },
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('promoteUser error:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}
