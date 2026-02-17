'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';
import type { Book } from '@prisma/client';

export interface CurrentlyReadingBook {
  userBookId: string;
  bookId: string;
  book: Book;
  progress: number;
  lastSessionAt: Date | null;
}

export async function getUserCurrentlyReading(): Promise<
  ActionResult<CurrentlyReadingBook[]>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userBooks = await prisma.userBook.findMany({
      where: {
        userId: session.user.id,
        status: 'CURRENTLY_READING',
        deletedAt: null,
      },
      include: {
        book: true,
      },
      take: 4,
    });

    // Get most recent session for each book
    const bookIds = userBooks.map((ub) => ub.bookId);
    const latestSessions =
      bookIds.length > 0
        ? await prisma.readingSession.findMany({
            where: {
              userId: session.user.id,
              bookId: { in: bookIds },
            },
            orderBy: { endedAt: 'desc' },
            distinct: ['bookId'],
            select: { bookId: true, endedAt: true },
          })
        : [];

    const sessionMap = new Map(
      latestSessions.map((s) => [s.bookId, s.endedAt]),
    );

    const books: CurrentlyReadingBook[] = userBooks.map((ub) => ({
      userBookId: ub.id,
      bookId: ub.bookId,
      book: ub.book,
      progress: ub.progress,
      lastSessionAt: sessionMap.get(ub.bookId) ?? null,
    }));

    // Sort by most recent session first, then by dateAdded
    books.sort((a, b) => {
      const aTime = a.lastSessionAt?.getTime() ?? 0;
      const bTime = b.lastSessionAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    return { success: true, data: books };
  } catch (error) {
    console.error('Failed to fetch currently reading books:', error);
    return { success: false, error: 'Failed to load currently reading books' };
  }
}
