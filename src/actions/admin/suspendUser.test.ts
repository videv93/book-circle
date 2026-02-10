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
    userSuspension: { create: vi.fn() },
    session: { deleteMany: vi.fn() },
    roomPresence: { updateMany: vi.fn() },
    moderationItem: { update: vi.fn(), findUnique: vi.fn() },
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

import { suspendUser } from './suspendUser';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const validInput = {
  userId: 'user-1',
  duration: 'DAYS_7',
  reason: 'Repeated violations of community guidelines after multiple warnings.',
};

describe('suspendUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user-1', suspendedUntil: null });
    mockTransaction.mockResolvedValue([
      { id: 'suspension-1', userId: 'user-1', duration: 'DAYS_7' },
    ]);
  });

  it('suspends user successfully', async () => {
    const result = await suspendUser(validInput);
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await suspendUser(validInput);
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error for non-admin user', async () => {
    mockFindUnique.mockReset();
    mockFindUnique.mockResolvedValueOnce({ id: 'user-2', role: 'USER' });
    const result = await suspendUser(validInput);
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error if target user not found', async () => {
    mockFindUnique.mockReset();
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce(null);
    const result = await suspendUser(validInput);
    expect(result).toEqual({ success: false, error: 'User not found' });
  });

  it('returns error if user already suspended', async () => {
    mockFindUnique.mockReset();
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({
        id: 'user-1',
        suspendedUntil: new Date(Date.now() + 86400000),
      });
    const result = await suspendUser(validInput);
    expect(result).toEqual({ success: false, error: 'User is already suspended' });
  });

  it('returns error for invalid input', async () => {
    const result = await suspendUser({ userId: '', duration: 'INVALID', reason: '' });
    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });

  it('handles permanent suspension', async () => {
    const permanentInput = { ...validInput, duration: 'PERMANENT' };
    await suspendUser(permanentInput);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('prevents admin from suspending themselves', async () => {
    const selfInput = { ...validInput, userId: 'admin-1' };
    const result = await suspendUser(selfInput);
    expect(result).toEqual({ success: false, error: 'Cannot suspend yourself' });
  });

  it('passes correct number of operations to transaction', async () => {
    mockFindUnique.mockReset();
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user-1', suspendedUntil: null });
    mockTransaction.mockResolvedValue([
      { id: 'suspension-1', userId: 'user-1', duration: 'DAYS_7' },
    ]);
    const result = await suspendUser(validInput);
    expect(result.success).toBe(true);
    const transactionArg = mockTransaction.mock.calls[0][0];
    // suspension.create + user.update + session.deleteMany + roomPresence.updateMany + adminAction.create
    expect(transactionArg).toHaveLength(5);
  });
});
