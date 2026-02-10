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

    // Use transaction to prevent race conditions on check + create
    const claim = await prisma.$transaction(async (tx) => {
      // Check for active (PENDING or APPROVED) claims
      const activeClaim = await tx.authorClaim.findFirst({
        where: {
          userId: session.user.id,
          bookId: validated.bookId,
          status: { in: ['PENDING', 'APPROVED'] },
        },
      });

      if (activeClaim) {
        if (activeClaim.status === 'PENDING') {
          throw new Error('You already have a pending claim for this book');
        }
        if (activeClaim.status === 'APPROVED') {
          throw new Error('You are already verified as the author of this book');
        }
      }

      // Check 7-day cooldown for rejected claims (preserves audit trail)
      const recentRejection = await tx.authorClaim.findFirst({
        where: {
          userId: session.user.id,
          bookId: validated.bookId,
          status: 'REJECTED',
          reviewedAt: { not: null },
        },
        orderBy: { reviewedAt: 'desc' },
      });

      if (recentRejection && recentRejection.reviewedAt) {
        const cooldownMs = 7 * 24 * 60 * 60 * 1000;
        const resubmitDate = new Date(recentRejection.reviewedAt.getTime() + cooldownMs);
        if (Date.now() < resubmitDate.getTime()) {
          throw new Error(
            `You can resubmit a claim after ${resubmitDate.toLocaleDateString()}. Please gather stronger evidence.`
          );
        }
      }

      return tx.authorClaim.create({
        data: {
          userId: session.user.id,
          bookId: validated.bookId,
          verificationMethod: validated.verificationMethod,
          verificationUrl: validated.verificationUrl || null,
          verificationText: validated.verificationText || null,
        },
      });
    });

    return { success: true, data: claim };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return { success: false, error: 'Invalid input' };
    }
    // Transaction throws Error with user-facing messages for duplicate claims and cooldown
    if (error instanceof Error && (
      error.message.includes('pending claim') ||
      error.message.includes('already verified') ||
      error.message.includes('You can resubmit')
    )) {
      return { success: false, error: error.message };
    }
    console.error('submitClaim error:', error);
    return { success: false, error: 'Failed to submit claim' };
  }
}
