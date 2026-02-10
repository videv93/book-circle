import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    userWarning: { findMany: vi.fn() },
  },
}));

import { getUnacknowledgedWarnings } from './getUnacknowledgedWarnings';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockWarningFindMany = prisma.userWarning.findMany as unknown as ReturnType<typeof vi.fn>;

describe('getUnacknowledgedWarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockWarningFindMany.mockResolvedValue([
      {
        id: 'warning-1',
        userId: 'user-1',
        warningType: 'FIRST_WARNING',
        message: 'Test warning',
        acknowledgedAt: null,
        createdAt: new Date(),
      },
    ]);
  });

  it('returns unacknowledged warnings', async () => {
    const result = await getUnacknowledgedWarnings();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('warning-1');
    }
    expect(mockWarningFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', acknowledgedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await getUnacknowledgedWarnings();
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns empty array when no warnings', async () => {
    mockWarningFindMany.mockResolvedValueOnce([]);
    const result = await getUnacknowledgedWarnings();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });
});
