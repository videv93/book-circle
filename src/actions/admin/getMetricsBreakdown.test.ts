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
    $queryRaw: vi.fn(),
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((user: { id: string; role?: string }) => {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  }),
}));

import { getMetricsBreakdown } from './getMetricsBreakdown';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockQueryRaw = (prisma as unknown as { $queryRaw: ReturnType<typeof vi.fn> }).$queryRaw;

function setupAdminSession() {
  mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
  mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
}

describe('getMetricsBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when no session', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getMetricsBreakdown('user');
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns forbidden when non-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const result = await getMetricsBreakdown('user');
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns breakdown entries for user category', async () => {
    setupAdminSession();
    mockQueryRaw.mockResolvedValue([
      { date: new Date('2026-01-15'), count: BigInt(10) },
      { date: new Date('2026-01-16'), count: BigInt(15) },
    ]);

    const result = await getMetricsBreakdown('user');

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.category).toBe('user');
    expect(result.data.entries).toHaveLength(2);
    expect(result.data.entries[0]).toEqual({ date: '2026-01-15', value: 10 });
    expect(result.data.entries[1]).toEqual({ date: '2026-01-16', value: 15 });
    expect(result.data.total).toBe(25);
  });

  it('queries for each category', async () => {
    setupAdminSession();
    mockQueryRaw.mockResolvedValue([]);

    await getMetricsBreakdown('engagement');

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('uses custom date range when provided', async () => {
    setupAdminSession();
    mockQueryRaw.mockResolvedValue([]);

    await getMetricsBreakdown('social', '2026-01-01', '2026-01-31');

    expect(mockQueryRaw).toHaveBeenCalledTimes(1);
  });

  it('handles empty data', async () => {
    setupAdminSession();
    mockQueryRaw.mockResolvedValue([]);

    const result = await getMetricsBreakdown('content');

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.entries).toHaveLength(0);
    expect(result.data.total).toBe(0);
  });

  it('handles query errors gracefully', async () => {
    setupAdminSession();
    mockQueryRaw.mockRejectedValue(new Error('DB error'));

    const result = await getMetricsBreakdown('user');
    expect(result).toEqual({ success: false, error: 'Failed to fetch metrics breakdown' });
  });
});
