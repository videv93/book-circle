'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { UserBook } from '@prisma/client';
import type { ActionResult } from './types';

const updateStatusSchema = z.object({
  userBookId: z.string().min(1, 'UserBook ID is required'),
  status: z.enum(['CURRENTLY_READING', 'FINISHED', 'WANT_TO_READ']),
});

export type UpdateReadingStatusInput = z.infer<typeof updateStatusSchema>;

/**
 * Update the reading status of a book in the user's library.
 * Handles status transition side effects (progress, dateFinished).
 */
export async function updateReadingStatus(
  input: UpdateReadingStatusInput
): Promise<ActionResult<UserBook>> {
  try {
    const validated = updateStatusSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to update status' };
    }

    // Verify the UserBook exists and belongs to this user
    const existing = await prisma.userBook.findUnique({
      where: { id: validated.userBookId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: 'Book not found in your library' };
    }

    // No-op if status unchanged
    if (existing.status === validated.status) {
      return { success: true, data: existing };
    }

    // Build update data based on status transitions
    const updateData: {
      status: typeof validated.status;
      progress?: number;
      dateFinished?: Date | null;
    } = {
      status: validated.status,
    };

    if (validated.status === 'FINISHED') {
      updateData.progress = 100;
      updateData.dateFinished = new Date();
    } else if (
      validated.status === 'CURRENTLY_READING' &&
      existing.status === 'FINISHED'
    ) {
      // Moving back from Finished: clear dateFinished, keep progress at 100
      updateData.dateFinished = null;
    } else if (validated.status === 'WANT_TO_READ') {
      updateData.dateFinished = null;
      updateData.progress = 0;
    }

    const updated = await prisma.userBook.update({
      where: { id: validated.userBookId },
      data: updateData,
    });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }
    console.error('Failed to update reading status:', error);
    return { success: false, error: 'Failed to update reading status' };
  }
}
