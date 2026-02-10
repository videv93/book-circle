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
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((user: { id: string; role?: string }) => {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  }),
}));

import { getClaimDetail } from './getClaimDetail';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockClaimFindUnique = prisma.authorClaim.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockClaimFindMany = prisma.authorClaim.findMany as unknown as ReturnType<typeof vi.fn>;
const mockTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

describe('getClaimDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Interactive transaction delegates to the same prisma mock methods
    mockTransaction.mockImplementation((fn: Function) => fn(prisma));
  });

  it('returns error when claimId is empty', async () => {
    const result = await getClaimDetail('');
    expect(result).toEqual({ success: false, error: 'Claim ID is required' });
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getClaimDetail('claim-1');
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error when user is not admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });

    const result = await getClaimDetail('claim-1');
    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error when claim not found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockClaimFindUnique.mockResolvedValue(null);

    const result = await getClaimDetail('claim-nonexistent');
    expect(result).toEqual({ success: false, error: 'Claim not found' });
  });

  it('returns claim detail with history for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    const mockClaim = {
      id: 'claim-1',
      verificationMethod: 'AMAZON',
      verificationUrl: 'https://amazon.com/author/test',
      verificationText: null,
      status: 'PENDING',
      rejectionReason: null,
      adminNotes: null,
      createdAt: new Date('2026-02-01'),
      reviewedAt: null,
      userId: 'user-1',
      user: {
        id: 'user-1',
        name: 'Test Author',
        email: 'test@example.com',
        image: null,
        createdAt: new Date('2026-01-01'),
        role: 'USER',
      },
      book: {
        id: 'book-1',
        title: 'Test Book',
        author: 'Test Author',
        coverUrl: null,
      },
      reviewer: null,
    };
    mockClaimFindUnique.mockResolvedValue(mockClaim);

    const mockHistory = [
      {
        id: 'claim-old',
        status: 'REJECTED',
        verificationMethod: 'MANUAL',
        rejectionReason: 'INSUFFICIENT_EVIDENCE',
        createdAt: new Date('2026-01-15'),
        reviewedAt: new Date('2026-01-16'),
        book: { id: 'book-2', title: 'Another Book' },
      },
    ];
    mockClaimFindMany.mockResolvedValue(mockHistory);

    const result = await getClaimDetail('claim-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('claim-1');
      expect(result.data.user.name).toBe('Test Author');
      expect(result.data.book.title).toBe('Test Book');
      expect(result.data.claimHistory).toHaveLength(1);
      expect(result.data.claimHistory[0].status).toBe('REJECTED');
    }
  });

  it('returns empty claim history when user has no other claims', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'SUPER_ADMIN' });

    mockClaimFindUnique.mockResolvedValue({
      id: 'claim-1',
      verificationMethod: 'WEBSITE',
      verificationUrl: 'https://example.com',
      verificationText: null,
      status: 'PENDING',
      rejectionReason: null,
      adminNotes: null,
      createdAt: new Date(),
      reviewedAt: null,
      userId: 'user-1',
      user: {
        id: 'user-1',
        name: 'New Author',
        email: 'new@example.com',
        image: null,
        createdAt: new Date(),
        role: 'USER',
      },
      book: { id: 'book-1', title: 'My Book', author: 'New Author', coverUrl: null },
      reviewer: null,
    });
    mockClaimFindMany.mockResolvedValue([]);

    const result = await getClaimDetail('claim-1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.claimHistory).toHaveLength(0);
    }
  });
});
