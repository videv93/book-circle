'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPremium } from '@/lib/premium';
import { FREE_TIER_BOOK_LIMIT } from '@/lib/config/constants';
import type { Book, ReadingStatus } from '@prisma/client';
import type { AddToLibraryResult } from './types';

// Input validation schema
const addToLibrarySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  authors: z.array(z.string().optional()),
  isbn10: z.string().optional(),
  isbn13: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  pageCount: z.number().int().positive().optional(),
  publishedYear: z.number().int().optional(),
  description: z.string().optional(),
  status: z.enum(['CURRENTLY_READING', 'FINISHED', 'WANT_TO_READ']),
});

export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;

/**
 * Add a book to the user's library with the specified reading status.
 * Creates the Book record if it doesn't exist (upsert by ISBN).
 */
export async function addToLibrary(
  input: AddToLibraryInput
): Promise<AddToLibraryResult> {
  try {
    // Get authenticated user
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user?.id) {
      return { success: false, error: 'You must be logged in to add books' };
    }

    // Validate input
    const validated = addToLibrarySchema.parse(input);

    // Clean empty coverUrl
    const coverUrl = validated.coverUrl || undefined;

    // Determine upsert strategy based on available ISBNs
    const bookWhere = validated.isbn13
      ? { isbn13: validated.isbn13 }
      : validated.isbn10
        ? { isbn10: validated.isbn10 }
        : undefined;

    let book: Book;

    if (bookWhere) {
      // Upsert book by ISBN
      book = await prisma.book.upsert({
        where: bookWhere,
        create: {
          isbn10: validated.isbn10,
          isbn13: validated.isbn13,
          title: validated.title,
          author: validated.authors.join(', '),
          coverUrl,
          pageCount: validated.pageCount,
          publishedYear: validated.publishedYear,
          description: validated.description,
        },
        update: {
          // Update fields that might have been missing before
          coverUrl: coverUrl ?? undefined,
          pageCount: validated.pageCount ?? undefined,
          description: validated.description ?? undefined,
        },
      });
    } else {
      // No ISBN available - create new book (rare case)
      book = await prisma.book.create({
        data: {
          title: validated.title,
          author: validated.authors.join(', '),
          coverUrl,
          pageCount: validated.pageCount,
          publishedYear: validated.publishedYear,
          description: validated.description,
        },
      });
    }

    // Check if user already has this book
    const existingUserBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId: session.user.id,
          bookId: book.id,
        },
      },
      include: { book: true },
    });

    if (existingUserBook) {
      // Active (non-deleted) duplicate — no limit check needed
      if (!existingUserBook.deletedAt) {
        return { success: false, error: 'This book is already in your library' };
      }

      // Soft-deleted — restoring would increase active count, so check limit
      const userIsPremium = await isPremium(session.user.id);
      if (!userIsPremium) {
        const activeBookCount = await prisma.userBook.count({
          where: { userId: session.user.id, deletedAt: null },
        });
        if (activeBookCount >= FREE_TIER_BOOK_LIMIT) {
          return {
            success: false,
            error: `You've reached the free tier limit of ${FREE_TIER_BOOK_LIMIT} books. Upgrade to premium for unlimited tracking!`,
            code: 'BOOK_LIMIT_REACHED',
            premiumStatus: 'FREE',
            currentBookCount: activeBookCount,
            maxBooks: FREE_TIER_BOOK_LIMIT,
          };
        }
      }

      // Restore soft-deleted book
      const restored = await prisma.userBook.update({
        where: { id: existingUserBook.id },
        data: {
          deletedAt: null,
          status: validated.status as ReadingStatus,
          progress: validated.status === 'FINISHED' ? 100 : 0,
          dateAdded: new Date(),
          dateFinished: validated.status === 'FINISHED' ? new Date() : null,
        },
        include: { book: true },
      });
      return { success: true, data: restored };
    }

    // New book — check limit for free users
    const userIsPremium = await isPremium(session.user.id);
    if (!userIsPremium) {
      const activeBookCount = await prisma.userBook.count({
        where: { userId: session.user.id, deletedAt: null },
      });
      if (activeBookCount >= FREE_TIER_BOOK_LIMIT) {
        return {
          success: false,
          error: `You've reached the free tier limit of ${FREE_TIER_BOOK_LIMIT} books. Upgrade to premium for unlimited tracking!`,
          code: 'BOOK_LIMIT_REACHED',
          premiumStatus: 'FREE',
          currentBookCount: activeBookCount,
          maxBooks: FREE_TIER_BOOK_LIMIT,
        };
      }
    }

    // Create UserBook record
    const userBook = await prisma.userBook.create({
      data: {
        userId: session.user.id,
        bookId: book.id,
        status: validated.status as ReadingStatus,
        progress: validated.status === 'FINISHED' ? 100 : 0,
        dateFinished: validated.status === 'FINISHED' ? new Date() : null,
      },
      include: {
        book: true,
      },
    });

    return { success: true, data: userBook };
  } catch (error) {
    console.error('Failed to add book to library:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid book data' };
    }
    return { success: false, error: 'Failed to add book to library' };
  }
}
