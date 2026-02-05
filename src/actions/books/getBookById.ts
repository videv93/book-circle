'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { ActionResult } from './types';
import type { Book, ReadingStatus } from '@prisma/client';

export interface BookDetailData {
  book: Book;
  stats: {
    totalReaders: number;
    currentlyReading: number;
  };
  userStatus?: {
    isInLibrary: boolean;
    status: ReadingStatus;
    progress: number;
    userBookId: string;
  };
  authorVerified: boolean;
}

export async function getBookById(
  id: string
): Promise<ActionResult<BookDetailData>> {
  try {
    // Fetch book by ID or ISBN
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { isbn10: id }, { isbn13: id }],
      },
    });

    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Aggregate reader counts
    const [totalReaders, currentlyReading] = await Promise.all([
      prisma.userBook.count({
        where: { bookId: book.id },
      }),
      prisma.userBook.count({
        where: {
          bookId: book.id,
          status: 'CURRENTLY_READING',
        },
      }),
    ]);

    // Check if current user has this book
    let userStatus: BookDetailData['userStatus'] = undefined;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      const userBook = await prisma.userBook.findUnique({
        where: {
          userId_bookId: {
            userId: session.user.id,
            bookId: book.id,
          },
        },
      });

      if (userBook) {
        userStatus = {
          isInLibrary: true,
          status: userBook.status,
          progress: userBook.progress,
          userBookId: userBook.id,
        };
      }
    }

    return {
      success: true,
      data: {
        book,
        stats: {
          totalReaders,
          currentlyReading,
        },
        userStatus,
        authorVerified: false, // Placeholder for future author claim feature
      },
    };
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return { success: false, error: 'Failed to load book details' };
  }
}
