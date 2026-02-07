import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFollowStatus } from './getFollowStatus';

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
    follow: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockFollowFindUnique = prisma.follow.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockFollowCount = prisma.follow.count as unknown as ReturnType<typeof vi.fn>;

describe('getFollowStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns isFollowing: true when following', async () => {
    mockFollowFindUnique.mockResolvedValue({ id: 'follow-1' });
    mockFollowCount.mockResolvedValue(5);

    const result = await getFollowStatus({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFollowing).toBe(true);
    }
  });

  it('returns isFollowing: false when not following', async () => {
    mockFollowFindUnique.mockResolvedValue(null);
    mockFollowCount.mockResolvedValue(0);

    const result = await getFollowStatus({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isFollowing).toBe(false);
    }
  });

  it('returns correct follower/following counts', async () => {
    mockFollowFindUnique.mockResolvedValue(null);
    // First count call = followers (followingId), second = following (followerId)
    mockFollowCount.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

    const result = await getFollowStatus({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followerCount).toBe(10);
      expect(result.data.followingCount).toBe(3);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getFollowStatus({ targetUserId: 'user-2' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });
});
