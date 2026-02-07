import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeKudos } from './removeKudos';

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
    readingSession: {
      findUnique: vi.fn(),
    },
    kudos: {
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockSessionFindUnique = prisma.readingSession.findUnique as ReturnType<typeof vi.fn>;
const mockKudosDelete = (prisma as unknown as { kudos: { delete: ReturnType<typeof vi.fn> } }).kudos.delete;
const mockKudosCount = (prisma as unknown as { kudos: { count: ReturnType<typeof vi.fn> } }).kudos.count;

describe('removeKudos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });
  });

  it('deletes kudos record successfully', async () => {
    mockKudosDelete.mockResolvedValue({
      id: 'kudos-1',
      giverId: 'user-1',
      sessionId: 'session-1',
    });
    mockKudosCount.mockResolvedValue(2);

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(2);
    }
  });

  it('returns updated kudos count', async () => {
    mockKudosDelete.mockResolvedValue({ id: 'kudos-1' });
    mockKudosCount.mockResolvedValue(0);

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(0);
    }
  });

  it('handles non-existent kudos gracefully (idempotent P2025)', async () => {
    const p2025Error = new Error('Record not found');
    Object.assign(p2025Error, { code: 'P2025' });
    mockKudosDelete.mockRejectedValue(p2025Error);
    mockKudosCount.mockResolvedValue(3);

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(3);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('returns error when session does not exist', async () => {
    mockSessionFindUnique.mockResolvedValue(null);

    const result = await removeKudos({
      sessionId: 'nonexistent',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Session not found');
    }
  });

  it('returns error when session does not belong to target user', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-3', // Not user-2
    });

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Session does not belong to target user');
    }
  });

  it('handles Prisma errors gracefully', async () => {
    mockKudosDelete.mockRejectedValue(new Error('Database error'));

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to remove kudos');
    }
  });

  it('calls prisma.kudos.delete with correct where clause', async () => {
    mockKudosDelete.mockResolvedValue({ id: 'kudos-1' });
    mockKudosCount.mockResolvedValue(0);

    await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(mockKudosDelete).toHaveBeenCalledWith({
      where: {
        giverId_sessionId: {
          giverId: 'user-1',
          sessionId: 'session-1',
        },
      },
    });
  });

  it('handles invalid input gracefully', async () => {
    const result = await removeKudos({
      sessionId: '',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to remove kudos');
    }
  });

  it('counts remaining kudos after deletion', async () => {
    mockKudosDelete.mockResolvedValue({ id: 'kudos-1' });
    mockKudosCount.mockResolvedValue(5);

    const result = await removeKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(mockKudosCount).toHaveBeenCalledWith({
      where: { sessionId: 'session-1' },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(5);
    }
  });
});
