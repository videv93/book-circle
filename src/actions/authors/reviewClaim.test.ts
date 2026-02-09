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
    },
    authorClaim: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    adminAction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  getPusher: vi.fn(() => ({
    trigger: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((user: { id: string; role?: string }) => {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  }),
}));

import { reviewClaim } from './reviewClaim';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockClaimFindUnique = prisma.authorClaim.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe('reviewClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'approve',
    });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error when user is not admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'regular-user' } });
    mockUserFindUnique.mockResolvedValue({ id: 'regular-user', role: 'USER' });

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'approve',
    });

    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error when user not found in database', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'ghost-user' } });
    mockUserFindUnique.mockResolvedValue(null);

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'approve',
    });

    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error when claim not found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockClaimFindUnique.mockResolvedValue(null);

    const result = await reviewClaim({
      claimId: 'claim-nonexistent',
      decision: 'approve',
    });

    expect(result).toEqual({ success: false, error: 'Claim not found' });
  });

  it('returns error when claim already reviewed', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockClaimFindUnique.mockResolvedValue({
      id: 'claim-1',
      status: 'APPROVED',
      userId: 'user-1',
      book: { title: 'Test Book' },
    });

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'reject',
    });

    expect(result).toEqual({
      success: false,
      error: 'Claim has already been reviewed',
    });
  });

  it('approves a claim successfully with admin action log', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockClaimFindUnique.mockResolvedValue({
      id: 'claim-1',
      status: 'PENDING',
      userId: 'user-1',
      book: { title: 'Test Book' },
    });
    const updatedClaim = {
      id: 'claim-1',
      status: 'APPROVED',
      reviewedById: 'admin-1',
    };
    mockTransaction.mockResolvedValue([updatedClaim, {}]);

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'approve',
    });

    expect(result).toEqual({ success: true, data: updatedClaim });
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('rejects a claim successfully', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockClaimFindUnique.mockResolvedValue({
      id: 'claim-1',
      status: 'PENDING',
      userId: 'user-1',
      book: { title: 'Test Book' },
    });
    const updatedClaim = {
      id: 'claim-1',
      status: 'REJECTED',
      reviewedById: 'admin-1',
    };
    mockTransaction.mockResolvedValue([updatedClaim, {}]);

    const result = await reviewClaim({
      claimId: 'claim-1',
      decision: 'reject',
    });

    expect(result).toEqual({ success: true, data: updatedClaim });
  });

  it('returns error for invalid input', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });

    const result = await reviewClaim({
      claimId: '',
      decision: 'invalid',
    });

    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });
});
