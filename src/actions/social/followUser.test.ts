import { describe, it, expect, vi, beforeEach } from 'vitest';
import { followUser } from './followUser';

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
    follow: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockFollowCreate = prisma.follow.create as unknown as ReturnType<typeof vi.fn>;
const mockFollowFindUnique = prisma.follow.findUnique as unknown as ReturnType<typeof vi.fn>;

describe('followUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('successfully creates follow record', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-2' });
    mockFollowCreate.mockResolvedValue({ id: 'follow-1' });

    const result = await followUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followId).toBe('follow-1');
    }
    expect(mockFollowCreate).toHaveBeenCalledWith({
      data: {
        followerId: 'user-1',
        followingId: 'user-2',
      },
    });
  });

  it('returns error when following yourself', async () => {
    const result = await followUser({ targetUserId: 'user-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Cannot follow yourself');
    }
    expect(mockFollowCreate).not.toHaveBeenCalled();
  });

  it('returns error when target user does not exist', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await followUser({ targetUserId: 'nonexistent' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('User not found');
    }
    expect(mockFollowCreate).not.toHaveBeenCalled();
  });

  it('handles duplicate follow gracefully (idempotent)', async () => {
    mockUserFindUnique.mockResolvedValue({ id: 'user-2' });
    const prismaError = new Error('Unique constraint failed');
    Object.assign(prismaError, { code: 'P2002' });
    mockFollowCreate.mockRejectedValue(prismaError);
    mockFollowFindUnique.mockResolvedValue({ id: 'existing-follow-1' });

    const result = await followUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followId).toBe('existing-follow-1');
    }
    expect(mockFollowFindUnique).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 'user-1',
          followingId: 'user-2',
        },
      },
      select: { id: true },
    });
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await followUser({ targetUserId: 'user-2' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });
});
