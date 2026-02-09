import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
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
      update: vi.fn(),
    },
    adminAction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/admin', () => ({
  isSuperAdmin: vi.fn((user: { id: string; role?: string }) => {
    return user.role === 'SUPER_ADMIN';
  }),
}));

import { promoteUser } from './promoteUser';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe('promoteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await promoteUser({ userId: 'user-1', newRole: 'ADMIN' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error when caller is not super-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    const result = await promoteUser({ userId: 'user-2', newRole: 'ADMIN' });

    expect(result).toEqual({ success: false, error: 'Only super-admins can change user roles' });
  });

  it('returns error when trying to change own role', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'super-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'super-1', role: 'SUPER_ADMIN' });

    const result = await promoteUser({ userId: 'super-1', newRole: 'ADMIN' });

    expect(result).toEqual({ success: false, error: 'Cannot change your own role' });
  });

  it('returns error when target user not found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'super-1' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'super-1', role: 'SUPER_ADMIN' })
      .mockResolvedValueOnce(null);

    const result = await promoteUser({ userId: 'nonexistent', newRole: 'ADMIN' });

    expect(result).toEqual({ success: false, error: 'User not found' });
  });

  it('returns error when target is another super-admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'super-1' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'super-1', role: 'SUPER_ADMIN' })
      .mockResolvedValueOnce({ id: 'super-2', role: 'SUPER_ADMIN' });

    const result = await promoteUser({ userId: 'super-2', newRole: 'ADMIN' });

    expect(result).toEqual({ success: false, error: 'Cannot change role of another super-admin' });
  });

  it('promotes user successfully', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'super-1' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ id: 'super-1', role: 'SUPER_ADMIN' })
      .mockResolvedValueOnce({ id: 'user-2', role: 'USER' });
    mockTransaction.mockResolvedValue([{ id: 'user-2', role: 'ADMIN' }, {}]);

    const result = await promoteUser({ userId: 'user-2', newRole: 'ADMIN' });

    expect(result).toEqual({
      success: true,
      data: {
        userId: 'user-2',
        newRole: 'ADMIN',
        previousRole: 'USER',
      },
    });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('returns error for invalid input', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'super-1' } });

    const result = await promoteUser({ userId: '', newRole: 'INVALID' });

    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });
});
