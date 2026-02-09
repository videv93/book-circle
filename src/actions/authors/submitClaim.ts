'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { submitClaimSchema } from '@/lib/validation/author';
import type { ActionResult } from '@/actions/books/types';
import type { AuthorClaim } from '@prisma/client';

export async function submitClaim(
  input: unknown
): Promise<ActionResult<AuthorClaim>> {
  try {
    const validated = submitClaimSchema.parse(input);

    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check for existing pending or approved claim for same user+book
    const existingClaim = await prisma.authorClaim.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: validated.bookId,
        },
      },
    });

    if (existingClaim) {
      if (existingClaim.status === 'PENDING') {
        return { success: false, error: 'You already have a pending claim for this book' };
      }
      if (existingClaim.status === 'APPROVED') {
        return { success: false, error: 'You are already verified as the author of this book' };
      }
      // If REJECTED, allow re-submission by deleting the old claim
      await prisma.authorClaim.delete({
        where: { id: existingClaim.id },
      });
    }

    const claim = await prisma.authorClaim.create({
      data: {
        userId: session.user.id,
        bookId: validated.bookId,
        verificationMethod: validated.verificationMethod,
        verificationUrl: validated.verificationUrl || null,
        verificationText: validated.verificationText || null,
      },
    });

    return { success: true, data: claim };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    console.error('submitClaim error:', error);
    return { success: false, error: 'Failed to submit claim' };
  }
}
