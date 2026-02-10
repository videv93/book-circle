'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';
import type { ClaimStatus } from '@prisma/client';

export interface ClaimStatusData {
  hasClaim: boolean;
  status?: ClaimStatus;
  claimId?: string;
}

export async function getClaimStatus(
  bookId: string
): Promise<ActionResult<ClaimStatusData>> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: true, data: { hasClaim: false } };
    }

    const claim = await prisma.authorClaim.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
      },
    });

    if (!claim) {
      return { success: true, data: { hasClaim: false } };
    }

    return {
      success: true,
      data: {
        hasClaim: true,
        status: claim.status,
        claimId: claim.id,
      },
    };
  } catch (error) {
    console.error('getClaimStatus error:', error);
    return { success: false, error: 'Failed to get claim status' };
  }
}
