'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { searchOpenLibrary } from '@/services/books/openLibrary';
import { deduplicateResults } from '@/services/books';
import type { ActionResult } from './types';
import type { BookSearchResult } from '@/services/books/types';

const bookIdSchema = z.string().min(1, 'Book ID is required');

export interface RecommendedBook {
  id?: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn10?: string;
  isbn13?: string;
  friendCount: number;
  source: 'author' | 'similar';
}

export async function getRecommendations(
  bookId: string
): Promise<ActionResult<RecommendedBook[]>> {
  try {
    const parsed = bookIdSchema.safeParse(bookId);
    if (!parsed.success) {
      return { success: false, error: 'Invalid book ID' };
    }

    // Fetch the book to get metadata
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true, title: true, author: true, isbn10: true, isbn13: true },
    });

    if (!book) {
      return { success: false, error: 'Book not found' };
    }

    // Get current user for library filtering and social proof
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    const userId = session?.user?.id;

    // Get user's existing library ISBNs to filter out
    const userBookIsbns = new Set<string>();
    if (userId) {
      const userBooks = await prisma.userBook.findMany({
        where: { userId, deletedAt: null },
        select: { book: { select: { isbn10: true, isbn13: true } } },
      });
      for (const ub of userBooks) {
        if (ub.book.isbn10) userBookIsbns.add(ub.book.isbn10);
        if (ub.book.isbn13) userBookIsbns.add(ub.book.isbn13);
      }
    }

    // Search for same-author books and similar books in parallel
    const [authorResults, similarResults] = await Promise.allSettled([
      book.author ? searchOpenLibrary(`author:${book.author}`, 10) : Promise.resolve({ results: [], totalFound: 0, source: 'openlibrary' as const }),
      searchOpenLibrary(book.title, 10),
    ]);

    const authorBooks: BookSearchResult[] = authorResults.status === 'fulfilled' ? authorResults.value.results : [];
    const similarBooks: BookSearchResult[] = similarResults.status === 'fulfilled' ? similarResults.value.results : [];

    // Deduplicate combined results
    const allResults = deduplicateResults([...authorBooks, ...similarBooks]);

    // Filter out the current book and books in user's library
    const currentIsbns = new Set<string>();
    if (book.isbn10) currentIsbns.add(book.isbn10);
    if (book.isbn13) currentIsbns.add(book.isbn13);

    const filtered = allResults.filter((r) => {
      // Exclude current book
      if (r.isbn10 && currentIsbns.has(r.isbn10)) return false;
      if (r.isbn13 && currentIsbns.has(r.isbn13)) return false;
      if (r.title.toLowerCase() === book.title.toLowerCase() && r.authors.includes(book.author ?? '')) return false;
      // Exclude books in user's library
      if (r.isbn10 && userBookIsbns.has(r.isbn10)) return false;
      if (r.isbn13 && userBookIsbns.has(r.isbn13)) return false;
      // Must have at least one ISBN for affiliate links
      if (!r.isbn10 && !r.isbn13) return false;
      return true;
    });

    // Tag source: author-match vs similar
    const authorIsbnSet = new Set(authorBooks.flatMap((b) => [b.isbn10, b.isbn13].filter(Boolean)));
    const tagged: RecommendedBook[] = filtered.slice(0, 5).map((r) => {
      const isAuthorMatch = (r.isbn10 && authorIsbnSet.has(r.isbn10)) || (r.isbn13 && authorIsbnSet.has(r.isbn13));
      return {
        title: r.title,
        author: r.authors[0] ?? 'Unknown',
        coverUrl: r.coverUrl,
        isbn10: r.isbn10,
        isbn13: r.isbn13,
        friendCount: 0,
        source: isAuthorMatch ? 'author' as const : 'similar' as const,
      };
    });

    // Add social proof if user is authenticated
    if (userId && tagged.length > 0) {
      const followedUserIds = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const friendIds = followedUserIds.map((f) => f.followingId);

      if (friendIds.length > 0) {
        // Collect all ISBNs from recommendations
        const recIsbns = tagged.flatMap((r) => [r.isbn10, r.isbn13].filter(Boolean) as string[]);

        // Find books in friends' libraries matching recommendation ISBNs
        const friendBooks = await prisma.userBook.findMany({
          where: {
            userId: { in: friendIds },
            deletedAt: null,
            book: {
              OR: [
                { isbn10: { in: recIsbns } },
                { isbn13: { in: recIsbns } },
              ],
            },
          },
          select: {
            book: { select: { isbn10: true, isbn13: true } },
          },
        });

        // Count unique friends per ISBN (track by both isbn10 and isbn13)
        const isbnFriendCount = new Map<string, number>();
        for (const fb of friendBooks) {
          if (fb.book.isbn10) isbnFriendCount.set(fb.book.isbn10, (isbnFriendCount.get(fb.book.isbn10) ?? 0) + 1);
          if (fb.book.isbn13) isbnFriendCount.set(fb.book.isbn13, (isbnFriendCount.get(fb.book.isbn13) ?? 0) + 1);
        }

        // Assign friend counts (use max of isbn10/isbn13 match to avoid double-counting)
        for (const rec of tagged) {
          const count10 = rec.isbn10 ? (isbnFriendCount.get(rec.isbn10) ?? 0) : 0;
          const count13 = rec.isbn13 ? (isbnFriendCount.get(rec.isbn13) ?? 0) : 0;
          rec.friendCount = Math.max(count10, count13);
        }
      }
    }

    // Sort: author-match first, then by friend count
    tagged.sort((a, b) => {
      if (a.source === 'author' && b.source !== 'author') return -1;
      if (a.source !== 'author' && b.source === 'author') return 1;
      return b.friendCount - a.friendCount;
    });

    return { success: true, data: tagged };
  } catch (error) {
    console.error('Failed to get recommendations:', error);
    return { success: false, error: 'Failed to load recommendations' };
  }
}
