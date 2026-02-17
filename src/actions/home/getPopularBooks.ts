'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';
import type { Book } from '@prisma/client';

export interface PopularBook {
  book: Book;
  totalReaders: number;
  recentSessions: number;
  isInUserLibrary: boolean;
}

export async function getPopularBooks(): Promise<ActionResult<PopularBook[]>> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    const userId = session?.user?.id;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get books with reader counts
    const booksWithReaders = await prisma.book.findMany({
      include: {
        _count: {
          select: {
            userBooks: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    // Get recent session counts per book
    const recentSessionCounts = await prisma.readingSession.groupBy({
      by: ['bookId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: true,
    });

    const sessionCountMap = new Map(
      recentSessionCounts.map((s) => [s.bookId, s._count]),
    );

    // Get user's library book IDs for checkmark
    let userBookIds = new Set<string>();
    if (userId) {
      const userBooks = await prisma.userBook.findMany({
        where: { userId, deletedAt: null },
        select: { bookId: true },
      });
      userBookIds = new Set(userBooks.map((ub) => ub.bookId));
    }

    // Score and sort books
    const scored: PopularBook[] = booksWithReaders.map((book) => {
      const { _count, ...bookData } = book;
      return {
        book: bookData as Book,
        totalReaders: _count.userBooks,
        recentSessions: sessionCountMap.get(book.id) ?? 0,
        isInUserLibrary: userBookIds.has(book.id),
      };
    });

    // Sort by combined score (total readers + recent sessions)
    scored.sort(
      (a, b) =>
        b.totalReaders + b.recentSessions - (a.totalReaders + a.recentSessions),
    );

    // Return top 6
    return { success: true, data: scored.slice(0, 6) };
  } catch (error) {
    console.error('Failed to fetch popular books:', error);
    return { success: false, error: 'Failed to load popular books' };
  }
}
