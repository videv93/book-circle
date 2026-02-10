import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    userWarning: { findMany: vi.fn() },
    userSuspension: { findMany: vi.fn() },
    contentRemoval: { findMany: vi.fn() },
    moderationItem: { count: vi.fn() },
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((u: { role: string }) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'),
}));

import { getUserModerationHistory } from './getUserModerationHistory';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockWarningFindMany = prisma.userWarning.findMany as unknown as ReturnType<typeof vi.fn>;
const mockSuspensionFindMany = prisma.userSuspension.findMany as unknown as ReturnType<typeof vi.fn>;
const mockContentRemovalFindMany = prisma.contentRemoval.findMany as unknown as ReturnType<typeof vi.fn>;
const mockModerationItemCount = prisma.moderationItem.count as unknown as ReturnType<typeof vi.fn>;

describe('getUserModerationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        suspendedUntil: null,
        suspensionReason: null,
        createdAt: new Date(),
      });
    mockWarningFindMany.mockResolvedValue([]);
    mockSuspensionFindMany.mockResolvedValue([]);
    mockContentRemovalFindMany.mockResolvedValue([]);
    mockModerationItemCount.mockResolvedValue(0);
  });

  it('returns moderation history successfully', async () => {
    const result = await getUserModerationHistory('user-1');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.id).toBe('user-1');
      expect(result.data.warnings).toEqual([]);
      expect(result.data.suspensions).toEqual([]);
      expect(result.data.contentRemovals).toEqual([]);
      expect(result.data.flagCount).toBe(0);
    }
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await getUserModerationHistory('user-1');
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error for non-admin user', async () => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user-2', role: 'USER' });
    const result = await getUserModerationHistory('user-1');
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error if user not found', async () => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce(null);
    const result = await getUserModerationHistory('user-1');
    expect(result).toEqual({ success: false, error: 'User not found' });
  });

  it('returns error for missing userId', async () => {
    const result = await getUserModerationHistory('');
    expect(result).toEqual({ success: false, error: 'User ID is required' });
  });
});
