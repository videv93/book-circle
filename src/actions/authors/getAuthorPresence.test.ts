import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuthorPresence } from './getAuthorPresence';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    authorClaim: { findFirst: vi.fn() },
    roomPresence: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';

const mockAuthorClaim = prisma.authorClaim as { findFirst: ReturnType<typeof vi.fn> };
const mockRoomPresence = prisma.roomPresence as { findFirst: ReturnType<typeof vi.fn> };

describe('getAuthorPresence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no approved claim exists for book', async () => {
    mockAuthorClaim.findFirst.mockResolvedValue(null);

    const result = await getAuthorPresence('book-1');

    expect(result).toEqual({ success: true, data: null });
    expect(mockRoomPresence.findFirst).not.toHaveBeenCalled();
  });

  it('returns null when author has no recent presence', async () => {
    mockAuthorClaim.findFirst.mockResolvedValue({
      userId: 'author-1',
      user: { id: 'author-1', name: 'Jane Author' },
    });
    mockRoomPresence.findFirst.mockResolvedValue(null);

    const result = await getAuthorPresence('book-1');

    expect(result).toEqual({ success: true, data: null });
  });

  it('returns isCurrentlyPresent=true when author is in room (leftAt null)', async () => {
    const lastActive = new Date('2026-02-09T10:00:00Z');
    mockAuthorClaim.findFirst.mockResolvedValue({
      userId: 'author-1',
      user: { id: 'author-1', name: 'Jane Author' },
    });
    mockRoomPresence.findFirst.mockResolvedValue({
      leftAt: null,
      lastActiveAt: lastActive,
      joinedAt: new Date('2026-02-09T08:00:00Z'),
    });

    const result = await getAuthorPresence('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        isCurrentlyPresent: true,
        lastSeenAt: lastActive,
        authorName: 'Jane Author',
        authorId: 'author-1',
      });
    }
  });

  it('returns isCurrentlyPresent=false when author left within 24h', async () => {
    const leftAt = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    mockAuthorClaim.findFirst.mockResolvedValue({
      userId: 'author-1',
      user: { id: 'author-1', name: 'Jane Author' },
    });
    mockRoomPresence.findFirst.mockResolvedValue({
      leftAt,
      lastActiveAt: leftAt,
      joinedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    });

    const result = await getAuthorPresence('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.isCurrentlyPresent).toBe(false);
      expect(result.data?.lastSeenAt).toEqual(leftAt);
    }
  });

  it('returns error for empty bookId', async () => {
    const result = await getAuthorPresence('');

    expect(result).toEqual({ success: false, error: 'Invalid book ID' });
  });

  it('uses author name fallback when name is null', async () => {
    mockAuthorClaim.findFirst.mockResolvedValue({
      userId: 'author-1',
      user: { id: 'author-1', name: null },
    });
    mockRoomPresence.findFirst.mockResolvedValue({
      leftAt: null,
      lastActiveAt: new Date(),
      joinedAt: new Date(),
    });

    const result = await getAuthorPresence('book-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.authorName).toBe('Author');
    }
  });

  it('only queries presence for the specific book (multiple books)', async () => {
    mockAuthorClaim.findFirst.mockResolvedValue({
      userId: 'author-1',
      user: { id: 'author-1', name: 'Jane Author' },
    });
    mockRoomPresence.findFirst.mockResolvedValue(null);

    await getAuthorPresence('book-2');

    expect(mockRoomPresence.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookId: 'book-2',
          userId: 'author-1',
          isAuthor: true,
        }),
      })
    );
  });
});
