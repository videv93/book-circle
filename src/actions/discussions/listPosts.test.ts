import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listPosts } from './listPosts';

const mockFindMany = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    discussionPost: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

const makePost = (id: string, overrides?: Record<string, unknown>) => ({
  id,
  title: `Post ${id}`,
  body: `Body of post ${id}`,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
  bookId: 'book-1',
  authorId: 'user-1',
  author: { id: 'user-1', name: 'Test User', image: 'https://example.com/avatar.jpg' },
  _count: { comments: 3 },
  ...overrides,
});

describe('listPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns posts with comment counts', async () => {
    mockFindMany.mockResolvedValue([makePost('p1'), makePost('p2')]);

    const result = await listPosts({ bookId: 'book-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(2);
      expect(result.data.posts[0].commentCount).toBe(3);
      expect(result.data.posts[0].author.name).toBe('Test User');
      expect(result.data.nextCursor).toBeNull();
    }
  });

  it('handles empty book with no posts', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await listPosts({ bookId: 'book-empty' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(0);
      expect(result.data.nextCursor).toBeNull();
    }
  });

  it('paginates correctly and returns cursor', async () => {
    // Return 21 posts (limit 20 + 1 to detect more)
    const posts = Array.from({ length: 21 }, (_, i) => makePost(`p${i}`));
    mockFindMany.mockResolvedValue(posts);

    const result = await listPosts({ bookId: 'book-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posts).toHaveLength(20);
      expect(result.data.nextCursor).toBe('p19');
    }
  });

  it('passes cursor to prisma query', async () => {
    mockFindMany.mockResolvedValue([]);

    await listPosts({ bookId: 'book-1', cursor: 'cursor-123' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: 'cursor-123' },
        skip: 1,
      })
    );
  });

  it('returns error on failure', async () => {
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const result = await listPosts({ bookId: 'book-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to load discussions');
    }
  });

  it('returns validation error for empty bookId', async () => {
    const result = await listPosts({ bookId: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid input');
    }
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('verifies orderBy descending createdAt', async () => {
    mockFindMany.mockResolvedValue([]);

    await listPosts({ bookId: 'book-1' });

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});
