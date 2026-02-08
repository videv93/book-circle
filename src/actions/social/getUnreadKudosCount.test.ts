import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUnreadKudosCount } from './getUnreadKudosCount';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
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
    user: {
      findUnique: vi.fn(),
    },
    kudos: {
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockKudosCount = (
  prisma as unknown as { kudos: { count: ReturnType<typeof vi.fn> } }
).kudos.count;

describe('getUnreadKudosCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getUnreadKudosCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('returns count of kudos received after lastActivityViewedAt', async () => {
    const lastViewed = new Date('2026-02-01');
    mockUserFindUnique.mockResolvedValue({
      lastActivityViewedAt: lastViewed,
    });
    mockKudosCount.mockResolvedValue(3);

    const result = await getUnreadKudosCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
    }
    expect(mockKudosCount).toHaveBeenCalledWith({
      where: {
        receiverId: 'user-1',
        createdAt: { gt: lastViewed },
      },
    });
  });

  it('uses epoch start when lastActivityViewedAt is null', async () => {
    mockUserFindUnique.mockResolvedValue({
      lastActivityViewedAt: null,
    });
    mockKudosCount.mockResolvedValue(10);

    const result = await getUnreadKudosCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(10);
    }
    expect(mockKudosCount).toHaveBeenCalledWith({
      where: {
        receiverId: 'user-1',
        createdAt: { gt: new Date(0) },
      },
    });
  });

  it('returns 0 when no unread kudos', async () => {
    mockUserFindUnique.mockResolvedValue({
      lastActivityViewedAt: new Date(),
    });
    mockKudosCount.mockResolvedValue(0);

    const result = await getUnreadKudosCount();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(0);
    }
  });

  it('handles database errors gracefully', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('DB error'));

    const result = await getUnreadKudosCount();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to get unread kudos count');
    }
  });

  it('queries for correct user ID', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-42', name: 'Test' },
    });
    mockUserFindUnique.mockResolvedValue({
      lastActivityViewedAt: null,
    });
    mockKudosCount.mockResolvedValue(0);

    await getUnreadKudosCount();

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-42' },
      select: { lastActivityViewedAt: true },
    });
    expect(mockKudosCount).toHaveBeenCalledWith({
      where: {
        receiverId: 'user-42',
        createdAt: { gt: new Date(0) },
      },
    });
  });
});
