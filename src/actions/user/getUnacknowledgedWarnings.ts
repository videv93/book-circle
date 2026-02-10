'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';
import type { UserWarning } from '@prisma/client';

export async function getUnacknowledgedWarnings(): Promise<
  ActionResult<UserWarning[]>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const warnings = await prisma.userWarning.findMany({
      where: {
        userId: session.user.id,
        acknowledgedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: warnings };
  } catch (error) {
    console.error('getUnacknowledgedWarnings error:', error);
    return { success: false, error: 'Failed to fetch warnings' };
  }
}
