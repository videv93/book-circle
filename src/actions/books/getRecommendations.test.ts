import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRecommendations } from './getRecommendations';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

const mockGetSession = vi.fn().mockResolvedValue(null);
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    book: { findUnique: vi.fn() },
    userBook: { findMany: vi.fn().mockResolvedValue([]) },
    follow: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock('@/services/books/openLibrary', () => ({
  searchOpenLibrary: vi.fn().mockResolvedValue({ results: [], totalFound: 0, source: 'openlibrary' }),
}));

vi.mock('@/services/books', () => ({
  deduplicateResults: vi.fn((results: unknown[]) => results),
}));

describe('getRecommendations', () => {
  let prisma: { book: { findUnique: ReturnType<typeof vi.fn> }; userBook: { findMany: ReturnType<typeof vi.fn> }; follow: { findMany: ReturnType<typeof vi.fn> } };
  let searchOpenLibrary: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const prismaModule = await import('@/lib/prisma');
    prisma = prismaModule.prisma as unknown as typeof prisma;
    const olModule = await import('@/services/books/openLibrary');
    searchOpenLibrary = olModule.searchOpenLibrary as unknown as ReturnType<typeof vi.fn>;
    searchOpenLibrary.mockResolvedValue({ results: [], totalFound: 0, source: 'openlibrary' });
  });

  it('returns error when book not found', async () => {
    prisma.book.findUnique.mockResolvedValue(null);
    const result = await getRecommendations('nonexistent');
    expect(result).toEqual({ success: false, error: 'Book not found' });
  });

  it('returns empty recommendations when no results from OpenLibrary', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    const result = await getRecommendations('book-1');
    expect(result).toEqual({ success: true, data: [] });
  });

  it('returns recommendations from author search', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    searchOpenLibrary.mockImplementation((query: string) => {
      if (query.includes('author:')) {
        return Promise.resolve({
          results: [
            { id: 'ol-1', source: 'openlibrary', title: 'Other Book', authors: ['Test Author'], isbn10: '0987654321', isbn13: undefined, coverUrl: 'http://cover.jpg' },
          ],
          totalFound: 1,
          source: 'openlibrary',
        });
      }
      return Promise.resolve({ results: [], totalFound: 0, source: 'openlibrary' });
    });

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Other Book');
      expect(result.data[0].source).toBe('author');
    }
  });

  it('filters out the current book from recommendations', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    searchOpenLibrary.mockImplementation((query: string) => {
      if (query.includes('author:')) {
        return Promise.resolve({
          results: [
            { id: 'ol-1', source: 'openlibrary', title: 'Test Book', authors: ['Test Author'], isbn10: '1234567890', isbn13: undefined },
            { id: 'ol-2', source: 'openlibrary', title: 'Another Book', authors: ['Test Author'], isbn10: '1111111111', isbn13: undefined },
          ],
          totalFound: 2,
          source: 'openlibrary',
        });
      }
      return Promise.resolve({ results: [], totalFound: 0, source: 'openlibrary' });
    });

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Another Book');
    }
  });

  it('filters out books without ISBN', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    searchOpenLibrary.mockResolvedValue({
      results: [
        { id: 'ol-1', source: 'openlibrary', title: 'No ISBN Book', authors: ['Author'], isbn10: undefined, isbn13: undefined },
      ],
      totalFound: 1,
      source: 'openlibrary',
    });

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });

  it('limits results to 5', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      id: `ol-${i}`, source: 'openlibrary', title: `Book ${i}`, authors: ['Author'],
      isbn10: `000000000${i}`, isbn13: undefined,
    }));

    searchOpenLibrary.mockResolvedValue({
      results: manyResults,
      totalFound: 10,
      source: 'openlibrary',
    });

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeLessThanOrEqual(5);
    }
  });

  it('populates friendCount from followed users libraries', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    searchOpenLibrary.mockImplementation((query: string) => {
      if (query.includes('author:')) {
        return Promise.resolve({
          results: [
            { id: 'ol-1', source: 'openlibrary', title: 'Friend Book', authors: ['Test Author'], isbn10: '0987654321', isbn13: '9780987654321', coverUrl: undefined },
          ],
          totalFound: 1,
          source: 'openlibrary',
        });
      }
      return Promise.resolve({ results: [], totalFound: 0, source: 'openlibrary' });
    });

    prisma.userBook.findMany.mockImplementation(({ where }: { where: { userId?: unknown } }) => {
      // Library check for current user
      if (where.userId === 'user-1') return Promise.resolve([]);
      // Friend books query (userId: { in: [...] })
      return Promise.resolve([
        { book: { isbn10: '0987654321', isbn13: '9780987654321' } },
        { book: { isbn10: '0987654321', isbn13: '9780987654321' } },
      ]);
    });

    prisma.follow.findMany.mockResolvedValue([
      { followingId: 'friend-1' },
      { followingId: 'friend-2' },
    ]);

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].friendCount).toBe(2);
    }
  });

  it('returns error for empty bookId', async () => {
    const result = await getRecommendations('');
    expect(result).toEqual({ success: false, error: 'Invalid book ID' });
  });

  it('handles OpenLibrary API failure gracefully', async () => {
    prisma.book.findUnique.mockResolvedValue({
      id: 'book-1', title: 'Test Book', author: 'Test Author', isbn10: '1234567890', isbn13: null,
    });

    searchOpenLibrary.mockRejectedValue(new Error('API down'));

    const result = await getRecommendations('book-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(0);
    }
  });
});
