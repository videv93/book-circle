'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { acknowledgeWarningSchema } from '@/lib/validation/admin';
import type { ActionResult } from '@/actions/books/types';

export async function acknowledgeWarning(
  input: unknown
): Promise<ActionResult<{ acknowledgedAt: Date }>> {
  try {
    const validated = acknowledgeWarningSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const warning = await prisma.userWarning.findUnique({
      where: { id: validated.warningId },
      select: { id: true, userId: true, acknowledgedAt: true },
    });

    if (!warning) {
      return { success: false, error: 'Warning not found' };
    }

    if (warning.userId !== session.user.id) {
      return { success: false, error: 'Forbidden' };
    }

    if (warning.acknowledgedAt) {
      return { success: false, error: 'Warning already acknowledged' };
    }

    const now = new Date();
    await prisma.userWarning.update({
      where: { id: validated.warningId },
      data: { acknowledgedAt: now },
    });

    return { success: true, data: { acknowledgedAt: now } };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('acknowledgeWarning error:', error);
    return { success: false, error: 'Failed to acknowledge warning' };
  }
}
