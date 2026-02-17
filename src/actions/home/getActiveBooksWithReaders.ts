'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ActionResult } from '@/types';
import type { Book } from '@prisma/client';

export interface ActiveBookReader {
  id: string;
  name: string;
  avatarUrl: string | null;
  isAuthor: boolean;
}

export interface ActiveBook {
  book: Book;
  readerCount: number;
  hasAuthorPresence: boolean;
  readers: ActiveBookReader[];
}

export async function getActiveBooksWithReaders(): Promise<
  ActionResult<ActiveBook[]>
> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // Find books with active room presence, including user info for avatars
    const activePresences = await prisma.roomPresence.findMany({
      where: {
        leftAt: null,
        lastActiveAt: { gte: thirtyMinutesAgo },
      },
      include: {
        book: true,
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (activePresences.length === 0) {
      return { success: true, data: [] };
    }

    // Group by book
    const bookMap = new Map<
      string,
      { book: Book; readerCount: number; hasAuthorPresence: boolean; readers: ActiveBookReader[] }
    >();

    for (const presence of activePresences) {
      const reader: ActiveBookReader = {
        id: presence.user.id,
        name: presence.user.name || 'Reader',
        avatarUrl: presence.user.image,
        isAuthor: presence.isAuthor,
      };
      const existing = bookMap.get(presence.bookId);
      if (existing) {
        existing.readerCount++;
        existing.readers.push(reader);
        if (presence.isAuthor) existing.hasAuthorPresence = true;
      } else {
        bookMap.set(presence.bookId, {
          book: presence.book,
          readerCount: 1,
          hasAuthorPresence: presence.isAuthor,
          readers: [reader],
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
