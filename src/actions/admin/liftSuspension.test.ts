import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    userSuspension: { findFirst: vi.fn(), update: vi.fn() },
    adminAction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((u: { role: string }) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN'),
}));

vi.mock('@/lib/pusher-server', () => ({
  getPusher: vi.fn(() => ({ trigger: vi.fn().mockResolvedValue(undefined) })),
}));

import { liftSuspension } from './liftSuspension';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockSuspensionFindFirst = prisma.userSuspension.findFirst as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe('liftSuspension', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({
        id: 'user-1',
        suspendedUntil: new Date(Date.now() + 86400000),
      });
    mockSuspensionFindFirst.mockResolvedValue({ id: 'susp-1', userId: 'user-1', liftedAt: null });
    mockTransaction.mockResolvedValue([{}]);
  });

  it('lifts suspension successfully', async () => {
    const result = await liftSuspension({ userId: 'user-1' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.liftedAt).toBeInstanceOf(Date);
    }
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await liftSuspension({ userId: 'user-1' });
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error for non-admin user', async () => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique.mockResolvedValueOnce({ id: 'user-2', role: 'USER' });
    const result = await liftSuspension({ userId: 'user-1' });
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error if user not suspended', async () => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user-1', suspendedUntil: null });
    const result = await liftSuspension({ userId: 'user-1' });
    expect(result).toEqual({ success: false, error: 'User is not currently suspended' });
  });

  it('returns error if user not found', async () => {
    mockUserFindUnique.mockReset();
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce(null);
    const result = await liftSuspension({ userId: 'user-1' });
    expect(result).toEqual({ success: false, error: 'User not found' });
  });
});
