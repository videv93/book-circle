import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToLibrary, type AddToLibraryInput } from './addToLibrary';
import { FREE_TIER_BOOK_LIMIT } from '@/lib/config/constants';

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      upsert: vi.fn(),
      create: vi.fn(),
    },
    userBook: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/premium', () => ({
  isPremium: vi.fn(),
}));

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isPremium } from '@/lib/premium';

const mockHeaders = headers as unknown as ReturnType<typeof vi.fn>;
const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockBookUpsert = prisma.book.upsert as unknown as ReturnType<typeof vi.fn>;
const mockBookCreate = prisma.book.create as unknown as ReturnType<typeof vi.fn>;
const mockUserBookFindUnique = prisma.userBook.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockUserBookCreate = prisma.userBook.create as unknown as ReturnType<typeof vi.fn>;
const mockUserBookUpdate = prisma.userBook.update as unknown as ReturnType<typeof vi.fn>;
const mockUserBookCount = prisma.userBook.count as unknown as ReturnType<typeof vi.fn>;
const mockIsPremium = isPremium as unknown as ReturnType<typeof vi.fn>;

describe('addToLibrary', () => {
  const validInput: AddToLibraryInput = {
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    isbn13: '9780743273565',
    status: 'CURRENTLY_READING',
  };

  const mockBook = {
    id: 'book-123',
    isbn13: '9780743273565',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserBook = {
    id: 'userbook-123',
    userId: 'user-123',
    bookId: 'book-123',
    status: 'CURRENTLY_READING',
    progress: 0,
    dateAdded: new Date(),
    dateFinished: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    book: mockBook,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    // Default: free user with 0 active books
    mockIsPremium.mockResolvedValue(false);
    mockUserBookCount.mockResolvedValue(0);
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await addToLibrary(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You must be logged in to add books');
    }
  });

  it('creates book and userBook when book does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookUpsert.mockResolvedValue(mockBook);
    mockUserBookFindUnique.mockResolvedValue(null);
    mockUserBookCreate.mockResolvedValue(mockUserBook);

    const result = await addToLibrary(validInput);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.book.title).toBe('The Great Gatsby');
      expect(result.data.status).toBe('CURRENTLY_READING');
    }

    expect(mockBookUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isbn13: '9780743273565' },
      })
    );
  });

  it('returns error when book already in library', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookUpsert.mockResolvedValue(mockBook);
    mockUserBookFindUnique.mockResolvedValue(mockUserBook);

    const result = await addToLibrary(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('This book is already in your library');
    }
  });

  it('sets progress to 100 when status is FINISHED', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookUpsert.mockResolvedValue(mockBook);
    mockUserBookFindUnique.mockResolvedValue(null);
    mockUserBookCreate.mockResolvedValue({
      ...mockUserBook,
      status: 'FINISHED',
      progress: 100,
    });

    const finishedInput = { ...validInput, status: 'FINISHED' as const };
    await addToLibrary(finishedInput);

    expect(mockUserBookCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'FINISHED',
          progress: 100,
        }),
      })
    );
  });

  it('creates book without ISBN when none provided', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookCreate.mockResolvedValue({ ...mockBook, isbn13: null, isbn10: null });
    mockUserBookFindUnique.mockResolvedValue(null);
    mockUserBookCreate.mockResolvedValue(mockUserBook);

    const inputWithoutISBN = {
      title: 'Unknown Book',
      authors: ['Unknown Author'],
      status: 'WANT_TO_READ' as const,
    };

    const result = await addToLibrary(inputWithoutISBN);

    expect(result.success).toBe(true);
    expect(mockBookCreate).toHaveBeenCalled();
    expect(mockBookUpsert).not.toHaveBeenCalled();
  });

  it('returns validation error for invalid input', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });

    const invalidInput = {
      title: '',
      authors: [],
      status: 'CURRENTLY_READING' as const,
    };

    const result = await addToLibrary(invalidInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid book data');
    }
  });

  it('prefers isbn13 over isbn10 for upsert lookup', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookUpsert.mockResolvedValue(mockBook);
    mockUserBookFindUnique.mockResolvedValue(null);
    mockUserBookCreate.mockResolvedValue(mockUserBook);

    const inputWithBothISBNs = {
      ...validInput,
      isbn10: '0743273567',
      isbn13: '9780743273565',
    };

    await addToLibrary(inputWithBothISBNs);

    expect(mockBookUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isbn13: '9780743273565' },
      })
    );
  });

  it('logs error and returns generic message on database failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockBookUpsert.mockRejectedValue(new Error('Database connection failed'));

    const result = await addToLibrary(validInput);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to add book to library');
    }
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to add book to library:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  describe('book limit enforcement', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
      mockBookUpsert.mockResolvedValue(mockBook);
    });

    it('allows free user with fewer than 3 active books to add a book', async () => {
      mockUserBookFindUnique.mockResolvedValue(null);
      mockUserBookCount.mockResolvedValue(1);
      mockUserBookCreate.mockResolvedValue(mockUserBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(true);
      expect(mockIsPremium).toHaveBeenCalledWith('user-123');
      expect(mockUserBookCount).toHaveBeenCalledWith({
        where: { userId: 'user-123', deletedAt: null },
      });
    });

    it('blocks free user with exactly 3 active books from adding a 4th', async () => {
      mockUserBookFindUnique.mockResolvedValue(null);
      mockUserBookCount.mockResolvedValue(3);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(false);
      if (!result.success && 'code' in result) {
        expect(result.code).toBe('BOOK_LIMIT_REACHED');
        expect(result.premiumStatus).toBe('FREE');
        expect(result.currentBookCount).toBe(3);
        expect(result.maxBooks).toBe(FREE_TIER_BOOK_LIMIT);
      } else {
        throw new Error('Expected BOOK_LIMIT_REACHED error');
      }
    });

    it('includes correct metadata in BOOK_LIMIT_REACHED error', async () => {
      mockUserBookFindUnique.mockResolvedValue(null);
      mockUserBookCount.mockResolvedValue(5);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(false);
      if (!result.success && 'code' in result) {
        expect(result.code).toBe('BOOK_LIMIT_REACHED');
        expect(result.premiumStatus).toBe('FREE');
        expect(result.currentBookCount).toBe(5);
        expect(result.maxBooks).toBe(3);
        expect(result.error).toContain('free tier limit');
      }
    });

    it('allows premium user to add books with no limit enforced', async () => {
      mockIsPremium.mockResolvedValue(true);
      mockUserBookFindUnique.mockResolvedValue(null);
      mockUserBookCreate.mockResolvedValue(mockUserBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(true);
      expect(mockIsPremium).toHaveBeenCalledWith('user-123');
      expect(mockUserBookCount).not.toHaveBeenCalled();
    });

    it('excludes soft-deleted books from active book count', async () => {
      mockUserBookFindUnique.mockResolvedValue(null);
      mockUserBookCount.mockResolvedValue(2);
      mockUserBookCreate.mockResolvedValue(mockUserBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(true);
      expect(mockUserBookCount).toHaveBeenCalledWith({
        where: { userId: 'user-123', deletedAt: null },
      });
    });

    it('blocks restoring a soft-deleted book when free user is at limit', async () => {
      mockUserBookFindUnique.mockResolvedValue({
        ...mockUserBook,
        deletedAt: new Date('2026-01-01'),
      });
      mockUserBookCount.mockResolvedValue(3);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(false);
      if (!result.success && 'code' in result) {
        expect(result.code).toBe('BOOK_LIMIT_REACHED');
        expect(result.currentBookCount).toBe(3);
      }
      expect(mockUserBookUpdate).not.toHaveBeenCalled();
    });

    it('allows restoring a soft-deleted book when free user is under limit', async () => {
      const restoredBook = { ...mockUserBook, deletedAt: null, dateAdded: new Date() };
      mockUserBookFindUnique.mockResolvedValue({
        ...mockUserBook,
        deletedAt: new Date('2026-01-01'),
      });
      mockUserBookCount.mockResolvedValue(2);
      mockUserBookUpdate.mockResolvedValue(restoredBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(true);
      expect(mockUserBookUpdate).toHaveBeenCalled();
    });

    it('returns "already in library" for non-deleted duplicates without limit check', async () => {
      mockUserBookFindUnique.mockResolvedValue(mockUserBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('This book is already in your library');
        expect('code' in result).toBe(false);
      }
      expect(mockIsPremium).not.toHaveBeenCalled();
      expect(mockUserBookCount).not.toHaveBeenCalled();
    });

    it('allows premium user to restore soft-deleted book with no limit check', async () => {
      const restoredBook = { ...mockUserBook, deletedAt: null };
      mockIsPremium.mockResolvedValue(true);
      mockUserBookFindUnique.mockResolvedValue({
        ...mockUserBook,
        deletedAt: new Date('2026-01-01'),
      });
      mockUserBookUpdate.mockResolvedValue(restoredBook);

      const result = await addToLibrary(validInput);

      expect(result.success).toBe(true);
      expect(mockUserBookCount).not.toHaveBeenCalled();
      expect(mockUserBookUpdate).toHaveBeenCalled();
    });
  });
});
