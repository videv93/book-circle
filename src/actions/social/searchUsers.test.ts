import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchUsers } from './searchUsers';

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
      findMany: vi.fn(),
      count: vi.fn(),
    },
    follow: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindMany = prisma.user.findMany as unknown as ReturnType<typeof vi.fn>;
const mockUserCount = prisma.user.count as unknown as ReturnType<typeof vi.fn>;
const mockFollowFindMany = prisma.follow.findMany as unknown as ReturnType<typeof vi.fn>;

describe('searchUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns matching users by name', async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: 'user-2',
        name: 'Jane Doe',
        bio: 'Reader',
        avatarUrl: null,
        image: null,
        _count: { followers: 5, following: 2 },
      },
    ]);
    mockUserCount.mockResolvedValue(1);
    mockFollowFindMany.mockResolvedValue([]);

    const result = await searchUsers({ query: 'Jane' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users).toHaveLength(1);
      expect(result.data.users[0].name).toBe('Jane Doe');
      expect(result.data.total).toBe(1);
    }
  });

  it('excludes current user from results', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    mockFollowFindMany.mockResolvedValue([]);

    await searchUsers({ query: 'Test' });

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'user-1' },
        }),
      })
    );
  });

  it('includes follow status for each result', async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: 'user-2',
        name: 'Jane',
        bio: null,
        avatarUrl: null,
        image: null,
        _count: { followers: 3, following: 1 },
      },
      {
        id: 'user-3',
        name: 'John',
        bio: null,
        avatarUrl: null,
        image: null,
        _count: { followers: 7, following: 4 },
      },
    ]);
    mockUserCount.mockResolvedValue(2);
    mockFollowFindMany.mockResolvedValue([{ followingId: 'user-2' }]);

    const result = await searchUsers({ query: 'J' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users[0].isFollowing).toBe(true);
      expect(result.data.users[1].isFollowing).toBe(false);
    }
  });

  it('returns empty array for no matches', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    mockFollowFindMany.mockResolvedValue([]);

    const result = await searchUsers({ query: 'zzzznonexistent' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users).toEqual([]);
      expect(result.data.total).toBe(0);
    }
  });

  it('respects limit and offset', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);
    mockFollowFindMany.mockResolvedValue([]);

    await searchUsers({ query: 'Test', limit: 5, offset: 10 });

    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 5,
        skip: 10,
      })
    );
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await searchUsers({ query: 'Test' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });
});
