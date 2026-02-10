import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { isPremium } from './premium';
import { prisma } from '@/lib/prisma';

const mockFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;

describe('isPremium', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when user has PREMIUM status', async () => {
    mockFindUnique.mockResolvedValue({ premiumStatus: 'PREMIUM' });

    const result = await isPremium('user-1');

    expect(result).toBe(true);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { premiumStatus: true },
    });
  });

  it('returns false when user has FREE status', async () => {
    mockFindUnique.mockResolvedValue({ premiumStatus: 'FREE' });

    const result = await isPremium('user-2');

    expect(result).toBe(false);
  });

  it('returns false when user does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await isPremium('non-existent-user');

    expect(result).toBe(false);
  });

  it('queries the correct user by ID', async () => {
    mockFindUnique.mockResolvedValue({ premiumStatus: 'FREE' });

    await isPremium('specific-user-id');

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'specific-user-id' },
      select: { premiumStatus: true },
    });
  });

  it('only selects premiumStatus field for efficiency', async () => {
    mockFindUnique.mockResolvedValue({ premiumStatus: 'FREE' });

    await isPremium('user-1');

    const call = mockFindUnique.mock.calls[0][0];
    expect(call.select).toEqual({ premiumStatus: true });
  });
});
