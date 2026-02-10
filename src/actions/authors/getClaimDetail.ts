'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/admin';
import type { ActionResult } from '@/actions/books/types';

export interface ClaimDetailData {
  id: string;
  verificationMethod: string;
  verificationUrl: string | null;
  verificationText: string | null;
  status: string;
  rejectionReason: string | null;
  adminNotes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
    role: string;
  };
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  reviewer: {
    id: string;
    name: string | null;
  } | null;
  claimHistory: {
    id: string;
    status: string;
    verificationMethod: string;
    rejectionReason: string | null;
    createdAt: Date;
    reviewedAt: Date | null;
    book: {
      id: string;
      title: string;
    };
  }[];
}

export async function getClaimDetail(
  claimId: string
): Promise<ActionResult<ClaimDetailData>> {
  try {
    if (!claimId) {
      return { success: false, error: 'Claim ID is required' };
    }

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

    const result = await prisma.$transaction(async (tx) => {
      const claim = await tx.authorClaim.findUnique({
        where: { id: claimId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
              role: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!claim) return null;

      // Fetch claim history for this user (all claims across all books)
      const claimHistory = await tx.authorClaim.findMany({
        where: {
          userId: claim.userId,
          id: { not: claim.id },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          verificationMethod: true,
          rejectionReason: true,
          createdAt: true,
          reviewedAt: true,
          book: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return { ...claim, claimHistory };
    });

    if (!result) {
      return { success: false, error: 'Claim not found' };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('getClaimDetail error:', error);
    return { success: false, error: 'Failed to fetch claim details' };
  }
}
