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
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: vi.fn((user: { id: string; role?: string }) => {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  }),
}));

import { getPendingClaims } from './getPendingClaims';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockFindMany = prisma.authorClaim.findMany as unknown as ReturnType<typeof vi.fn>;

describe('getPendingClaims', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getPendingClaims();

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error when user is not admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'regular-user' } });
    mockUserFindUnique.mockResolvedValue({ id: 'regular-user', role: 'USER' });

    const result = await getPendingClaims();

    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns error when user not found in database', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'ghost-user' } });
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getPendingClaims();

    expect(result).toEqual({ success: false, error: 'Forbidden' });
  });

  it('returns pending claims for admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    const mockClaims = [
      {
        id: 'claim-1',
        verificationMethod: 'AMAZON',
        verificationUrl: 'https://amazon.com/author/test',
        verificationText: null,
        createdAt: new Date('2026-02-01'),
        user: { id: 'user-1', name: 'Test', email: 'test@test.com', image: null },
        book: { id: 'book-1', title: 'Book', author: 'Author', coverUrl: null },
      },
    ];
    mockFindMany.mockResolvedValue(mockClaims);

    const result = await getPendingClaims();

    expect(result).toEqual({ success: true, data: mockClaims });
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        book: { select: { id: true, title: true, author: true, coverUrl: true } },
      },
    });
  });

  it('returns empty array when no pending claims', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockFindMany.mockResolvedValue([]);

    const result = await getPendingClaims();

    expect(result).toEqual({ success: true, data: [] });
  });

  it('returns error on database failure', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1' } });
    mockUserFindUnique.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mockFindMany.mockRejectedValue(new Error('DB error'));

    const result = await getPendingClaims();

    expect(result).toEqual({ success: false, error: 'Failed to fetch pending claims' });
  });
});
