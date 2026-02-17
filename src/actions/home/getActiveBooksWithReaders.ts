'use server';

import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';
import type { Book } from '@prisma/client';

export interface ActiveBook {
  book: Book;
  readerCount: number;
  hasAuthorPresence: boolean;
}

export async function getActiveBooksWithReaders(): Promise<
  ActionResult<ActiveBook[]>
> {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find books with active room presence
    const activePresences = await prisma.roomPresence.findMany({
      where: {
        leftAt: null,
        lastActiveAt: { gte: thirtyMinutesAgo },
      },
      include: {
        book: true,
      },
    });

    if (activePresences.length === 0) {
      return { success: true, data: [] };
    }

    // Group by book
    const bookMap = new Map<
      string,
      { book: Book; readerCount: number; hasAuthorPresence: boolean }
    >();

    for (const presence of activePresences) {
      const existing = bookMap.get(presence.bookId);
      if (existing) {
        existing.readerCount++;
        if (presence.isAuthor) existing.hasAuthorPresence = true;
      } else {
        bookMap.set(presence.bookId, {
          book: presence.book,
          readerCount: 1,
          hasAuthorPresence: presence.isAuthor,
        });
      }
    }

    // Sort by reader count descending
    const activeBooks = Array.from(bookMap.values()).sort(
      (a, b) => b.readerCount - a.readerCount,
    );

    return { success: true, data: activeBooks };
  } catch (error) {
    console.error('Failed to fetch active books with readers:', error);
    return { success: false, error: 'Failed to load active books' };
  }
}
