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
    userWarning: { create: vi.fn() },
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

import { warnUser } from './warnUser';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const mockModItemFindUnique = (prisma as unknown as { moderationItem: { findUnique: ReturnType<typeof vi.fn> } }).moderationItem.findUnique;

const validInput = {
  userId: 'user-1',
  warningType: 'FIRST_WARNING',
  message: 'You violated our community guidelines by posting inappropriate content.',
};

describe('warnUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user-1' });
    mockTransaction.mockResolvedValue([{ id: 'warning-1', ...validInput }]);
  });

  it('creates warning successfully', async () => {
    const result = await warnUser(validInput);
    expect(result.success).toBe(true);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('returns error for unauthenticated user', async () => {
    mockGetSession.mockResolvedValueOnce(null);
    const result = await warnUser(validInput);
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error for non-admin user', async () => {
    mockFindUnique.mockReset();
    mockFindUnique.mockResolvedValueOnce({ id: 'user-2', role: 'USER' });
    const result = await warnUser(validInput);
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error if target user not found', async () => {
    mockFindUnique.mockReset();
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce(null);
    const result = await warnUser(validInput);
    expect(result).toEqual({ success: false, error: 'User not found' });
  });

  it('returns error for invalid input', async () => {
    const result = await warnUser({ userId: '', warningType: 'INVALID', message: '' });
    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });

  it('includes moderationItemId when provided', async () => {
    mockModItemFindUnique.mockResolvedValueOnce({ reportedUserId: 'user-1' });
    const inputWithModItem = { ...validInput, moderationItemId: 'mod-1' };
    await warnUser(inputWithModItem);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('returns error when moderationItemId does not match target user', async () => {
    mockModItemFindUnique.mockResolvedValueOnce({ reportedUserId: 'other-user' });
    const inputWithModItem = { ...validInput, moderationItemId: 'mod-1' };
    const result = await warnUser(inputWithModItem);
    expect(result).toEqual({
      success: false,
      error: 'Moderation item does not match target user',
    });
  });

  it('prevents admin from warning themselves', async () => {
    const selfInput = { ...validInput, userId: 'admin-1' };
    const result = await warnUser(selfInput);
    expect(result).toEqual({ success: false, error: 'Cannot warn yourself' });
  });

  it('passes correct operations to transaction', async () => {
    mockFindUnique.mockReset();
    mockFindUnique
      .mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' })
      .mockResolvedValueOnce({ id: 'user-1' });
    mockTransaction.mockResolvedValue([{ id: 'warning-1', ...validInput }]);
    const result = await warnUser(validInput);
    expect(result.success).toBe(true);
    const transactionArg = mockTransaction.mock.calls[0][0];
    expect(transactionArg).toHaveLength(2); // userWarning.create + adminAction.create
  });
});
