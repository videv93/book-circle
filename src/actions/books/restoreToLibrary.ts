'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from './types';
import type { UserBook } from '@prisma/client';

const restoreToLibrarySchema = z.object({
  userBookId: z.string().min(1),
});

export type RestoreToLibraryInput = z.infer<typeof restoreToLibrarySchema>;

/**
 * Restore a soft-deleted book to the user's library.
 * Clears deletedAt timestamp, preserving all previous data.
 */
export async function restoreToLibrary(
  input: RestoreToLibraryInput
): Promise<ActionResult<UserBook>> {
  try {
    const validated = restoreToLibrarySchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await prisma.userBook.findUnique({
      where: { id: validated.userBookId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: 'Book not found' };
    }

    if (!existing.deletedAt) {
      return { success: false, error: 'Book is already in your library' };
    }

    // Restore by clearing deletedAt
    const updated = await prisma.userBook.update({
      where: { id: validated.userBookId },
      data: { deletedAt: null },
    });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('Failed to restore book to library:', error);
    return { success: false, error: 'Failed to restore book to library' };
  }
}
