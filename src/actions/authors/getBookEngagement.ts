'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/actions/books/types';

export interface BookEngagementData {
  libraryCount: number;
  currentlyReadingCount: number;
  roomOccupantCount: number;
}

export async function getBookEngagement(
  bookId: string
): Promise<ActionResult<BookEngagementData>> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify the user is a verified author of this book
    const approvedClaim = await prisma.authorClaim.findFirst({
      where: {
        userId: session.user.id,
        bookId,
        status: 'APPROVED',
      },
    });

    if (!approvedClaim) {
      return { success: false, error: 'Not a verified author of this book' };
    }

    const [libraryCount, currentlyReadingCount, roomOccupantCount] =
      await Promise.all([
        prisma.userBook.count({
          where: { bookId, deletedAt: null },
        }),
        prisma.userBook.count({
          where: { bookId, status: 'CURRENTLY_READING', deletedAt: null },
        }),
        prisma.roomPresence.count({
          where: { bookId, leftAt: null },
        }),
      ]);

    return {
      success: true,
      data: { libraryCount, currentlyReadingCount, roomOccupantCount },
    };
  } catch (error) {
    console.error('getBookEngagement error:', error);
    return { success: false, error: 'Failed to fetch engagement metrics' };
  }
}
