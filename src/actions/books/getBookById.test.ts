import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBookById } from './getBookById';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: {
      findFirst: vi.fn(),
    },
    userBook: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

describe('getBookById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBook = {
    id: 'book-123',
    isbn10: '0123456789',
    isbn13: '9780123456789',
    title: 'Test Book',
    author: 'Test Author',
    coverUrl: 'https://example.com/cover.jpg',
    pageCount: 300,
    publishedYear: 2024,
    description: 'A test book description',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should return book data by ID', async () => {
    vi.mocked(prisma.book.findFirst).mockResolvedValue(mockBook);
    vi.mocked(prisma.userBook.count)
      .mockResolvedValueOnce(10) // totalReaders
      .mockResolvedValueOnce(3); // currentlyReading
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const result = await getBookById('book-123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.book).toEqual(mockBook);
      expect(result.data.stats.totalReaders).toBe(10);
      expect(result.data.stats.currentlyReading).toBe(3);
      expect(result.data.userStatus).toBeUndefined();
      expect(result.data.authorVerified).toBe(false);
    }
  });

  it('should return book data by ISBN', async () => {
    vi.mocked(prisma.book.findFirst).mockResolvedValue(mockBook);
    vi.mocked(prisma.userBook.count)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const result = await getBookById('9780123456789');

    expect(result.success).toBe(true);
    expect(prisma.book.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { id: '9780123456789' },
          { isbn10: '9780123456789' },
          { isbn13: '9780123456789' },
        ],
      },
    });
  });

  it('should return error when book not found', async () => {
    vi.mocked(prisma.book.findFirst).mockResolvedValue(null);

    const result = await getBookById('nonexistent');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Book not found');
    }
  });

  const mockSessionUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    user: mockSessionUser,
    session: {
      id: 'session-123',
      userId: 'user-123',
      expiresAt: new Date(),
      token: 'token',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  it('should include user status when authenticated and book is in library', async () => {
    const mockUserBook = {
      id: 'userbook-123',
      userId: 'user-123',
      bookId: 'book-123',
      status: 'CURRENTLY_READING' as const,
      progress: 45,
      dateAdded: new Date(),
      dateFinished: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.book.findFirst).mockResolvedValue(mockBook);
    vi.mocked(prisma.userBook.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.userBook.findFirst).mockResolvedValue(mockUserBook);

    const result = await getBookById('book-123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userStatus).toEqual({
        isInLibrary: true,
        status: 'CURRENTLY_READING',
        progress: 45,
        userBookId: 'userbook-123',
      });
    }
  });

  it('should not include user status when book is not in library', async () => {
    vi.mocked(prisma.book.findFirst).mockResolvedValue(mockBook);
    vi.mocked(prisma.userBook.count)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession);
    vi.mocked(prisma.userBook.findFirst).mockResolvedValue(null);

    const result = await getBookById('book-123');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userStatus).toBeUndefined();
    }
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(prisma.book.findFirst).mockRejectedValue(
      new Error('Database error')
    );

    const result = await getBookById('book-123');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to load book details');
    }
  });
});
