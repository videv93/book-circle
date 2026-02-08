import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markActivityViewed } from './markActivityViewed';

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
    user: {
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserUpdate = prisma.user.update as unknown as ReturnType<typeof vi.fn>;

describe('markActivityViewed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await markActivityViewed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('updates lastActivityViewedAt timestamp', async () => {
    mockUserUpdate.mockResolvedValue({ id: 'user-1' });

    const result = await markActivityViewed();

    expect(result.success).toBe(true);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { lastActivityViewedAt: expect.any(Date) },
    });
  });

  it('returns success data on completion', async () => {
    mockUserUpdate.mockResolvedValue({ id: 'user-1' });

    const result = await markActivityViewed();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.success).toBe(true);
    }
  });

  it('handles database errors gracefully', async () => {
    mockUserUpdate.mockRejectedValue(new Error('DB error'));

    const result = await markActivityViewed();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to mark activity as viewed');
    }
  });

  it('uses correct user ID from session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-99', name: 'Another User' },
    });
    mockUserUpdate.mockResolvedValue({ id: 'user-99' });

    await markActivityViewed();

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-99' },
      data: { lastActivityViewedAt: expect.any(Date) },
    });
  });
});
