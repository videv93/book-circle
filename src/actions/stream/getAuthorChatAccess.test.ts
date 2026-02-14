import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetSession = vi.fn();
const mockIsPremium = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock('@/lib/premium', () => ({
  isPremium: (...args: unknown[]) => mockIsPremium(...args),
}));

import { getAuthorChatAccess } from './getAuthorChatAccess';

describe('getAuthorChatAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when no session', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getAuthorChatAccess();

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockIsPremium).not.toHaveBeenCalled();
  });

  it('returns isPremium true for premium user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockIsPremium.mockResolvedValue(true);

    const result = await getAuthorChatAccess();

    expect(result).toEqual({
      success: true,
      data: { isPremium: true },
    });
    expect(mockIsPremium).toHaveBeenCalledWith('user-1');
  });

  it('returns isPremium false for free user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-2' } });
    mockIsPremium.mockResolvedValue(false);

    const result = await getAuthorChatAccess();

    expect(result).toEqual({
      success: true,
      data: { isPremium: false },
    });
  });

  it('returns error on exception', async () => {
    mockGetSession.mockRejectedValue(new Error('DB down'));

    const result = await getAuthorChatAccess();

    expect(result).toEqual({
      success: false,
      error: 'Failed to check chat access',
    });
  });
});
