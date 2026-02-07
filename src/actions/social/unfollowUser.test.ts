import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unfollowUser } from './unfollowUser';

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
      delete: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockFollowDelete = prisma.follow.delete as unknown as ReturnType<typeof vi.fn>;

describe('unfollowUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('successfully deletes follow record', async () => {
    mockFollowDelete.mockResolvedValue({ id: 'follow-1' });

    const result = await unfollowUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unfollowed).toBe(true);
    }
    expect(mockFollowDelete).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 'user-1',
          followingId: 'user-2',
        },
      },
    });
  });

  it('handles "not following" gracefully', async () => {
    const prismaError = new Error('Record not found');
    Object.assign(prismaError, { code: 'P2025' });
    mockFollowDelete.mockRejectedValue(prismaError);

    const result = await unfollowUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unfollowed).toBe(true);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await unfollowUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });
});
