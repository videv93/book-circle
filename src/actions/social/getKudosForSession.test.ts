import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getKudosForSession } from './getKudosForSession';

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
    kudos: {
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockKudosCount = (prisma as unknown as { kudos: { count: ReturnType<typeof vi.fn> } }).kudos.count;
const mockKudosFindUnique = (prisma as unknown as { kudos: { findUnique: ReturnType<typeof vi.fn> } }).kudos.findUnique;

describe('getKudosForSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
  });

  it('returns kudos count and user state', async () => {
    mockKudosCount.mockResolvedValue(5);
    mockKudosFindUnique.mockResolvedValue({ id: 'kudos-1' });

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(5);
      expect(result.data.userGaveKudos).toBe(true);
    }
  });

  it('returns correct state when user gave kudos', async () => {
    mockKudosCount.mockResolvedValue(3);
    mockKudosFindUnique.mockResolvedValue({ id: 'kudos-1' });

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userGaveKudos).toBe(true);
    }

    expect(mockKudosFindUnique).toHaveBeenCalledWith({
      where: {
        giverId_sessionId: {
          giverId: 'user-1',
          sessionId: 'session-1',
        },
      },
      select: { id: true },
    });
  });

  it('returns correct state when user did not give kudos', async () => {
    mockKudosCount.mockResolvedValue(2);
    mockKudosFindUnique.mockResolvedValue(null);

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(2);
      expect(result.data.userGaveKudos).toBe(false);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('returns zero kudos for session with no kudos', async () => {
    mockKudosCount.mockResolvedValue(0);
    mockKudosFindUnique.mockResolvedValue(null);

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(0);
      expect(result.data.userGaveKudos).toBe(false);
    }
  });

  it('handles Prisma errors gracefully', async () => {
    mockKudosCount.mockRejectedValue(new Error('Database error'));

    const result = await getKudosForSession({ sessionId: 'session-1' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to get kudos');
    }
  });
});
