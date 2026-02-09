'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { fetchBookByISBN } from '@/services/books';
import type { ActionResult } from './types';
import type { Book, ReadingStatus } from '@prisma/client';

export type BookData = Book | ExternalBookData;

export interface ExternalBookData {
  id: string;
  isbn10: string | null;
  isbn13: string | null;
  title: string;
  author: string;
  coverUrl: string | null;
  pageCount: number | null;
  publishedYear: number | null;
  description: string | null;
  isExternal: true;
}

export interface BookDetailData {
  book: BookData;
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
      // Book not in database - try to fetch from OpenLibrary
      const externalBook = await fetchBookByISBN(id);

      if (!externalBook) {
        return { success: false, error: 'Book not found' };
      }

      // Return external book with default stats
      const externalData: ExternalBookData = {
        id: externalBook.isbn13 || externalBook.isbn10 || externalBook.id,
        isbn10: externalBook.isbn10 || null,
        isbn13: externalBook.isbn13 || null,
        title: externalBook.title,
        author: externalBook.authors.join(', ') || 'Unknown Author',
        coverUrl: externalBook.coverUrl || null,
        pageCount: externalBook.pageCount || null,
        publishedYear: externalBook.publishedYear || null,
        description: externalBook.description || null,
        isExternal: true,
      };

      return {
        success: true,
        data: {
          book: externalData,
          stats: {
            totalReaders: 0,
            currentlyReading: 0,
          },
          userStatus: undefined,
          authorVerified: false,
        },
      };
    }

    // Aggregate reader counts (exclude soft-deleted)
    const [totalReaders, currentlyReading] = await Promise.all([
      prisma.userBook.count({
        where: { bookId: book.id, deletedAt: null },
      }),
      prisma.userBook.count({
        where: {
          bookId: book.id,
          status: 'CURRENTLY_READING',
          deletedAt: null,
        },
      }),
    ]);

    // Check if current user has this book
    let userStatus: BookDetailData['userStatus'] = undefined;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      const userBook = await prisma.userBook.findFirst({
        where: {
          userId: session.user.id,
          bookId: book.id,
          deletedAt: null,
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

    // Check if any user has an approved author claim for this book
    const approvedClaim = await prisma.authorClaim.findFirst({
      where: {
        bookId: book.id,
        status: 'APPROVED',
      },
    });

    return {
      success: true,
      data: {
        book,
        stats: {
          totalReaders,
          currentlyReading,
        },
        userStatus,
        authorVerified: !!approvedClaim,
      },
    };
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return { success: false, error: 'Failed to load book details' };
  }
}
