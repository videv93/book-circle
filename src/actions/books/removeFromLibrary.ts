'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from './types';
import type { UserBook } from '@prisma/client';

const removeFromLibrarySchema = z.object({
  userBookId: z.string().min(1),
});

export type RemoveFromLibraryInput = z.infer<typeof removeFromLibrarySchema>;

/**
 * Soft-delete a book from the user's library.
 * Sets deletedAt timestamp instead of hard deleting to support undo.
 */
export async function removeFromLibrary(
  input: RemoveFromLibraryInput
): Promise<ActionResult<UserBook>> {
  try {
    const validated = removeFromLibrarySchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership and not already deleted
    const existing = await prisma.userBook.findUnique({
      where: { id: validated.userBookId },
    });

    if (!existing || existing.userId !== session.user.id) {
      return { success: false, error: 'Book not found in your library' };
    }

    if (existing.deletedAt) {
      return { success: false, error: 'Book already removed from library' };
    }

    // Soft-delete
    const updated = await prisma.userBook.update({
      where: { id: validated.userBookId },
      data: { deletedAt: new Date() },
    });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('Failed to remove book from library:', error);
    return { success: false, error: 'Failed to remove book from library' };
  }
}
