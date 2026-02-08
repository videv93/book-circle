import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePresenceHeartbeat } from './updatePresenceHeartbeat';

// Mock auth
const mockGetSession = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

// Mock prisma
const mockUpdateMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    roomPresence: {
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

describe('updatePresenceHeartbeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
  });

  it('returns unauthorized when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await updatePresenceHeartbeat('book-1');
    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns invalid error for empty bookId', async () => {
    const result = await updatePresenceHeartbeat('');
    expect(result).toEqual({ success: false, error: 'Invalid book ID' });
  });

  it('updates lastActiveAt for active presence', async () => {
    mockUpdateMany.mockResolvedValue({ count: 1 });
    const result = await updatePresenceHeartbeat('book-1');
    expect(result).toEqual({ success: true, data: { updated: true } });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        bookId: 'book-1',
        leftAt: null,
      },
      data: {
        lastActiveAt: expect.any(Date),
      },
    });
  });

  it('returns updated: false when no active presence found', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const result = await updatePresenceHeartbeat('book-1');
    expect(result).toEqual({ success: true, data: { updated: false } });
  });

  it('handles database errors gracefully', async () => {
    mockUpdateMany.mockRejectedValue(new Error('DB error'));
    const result = await updatePresenceHeartbeat('book-1');
    expect(result).toEqual({
      success: false,
      error: 'Failed to update presence heartbeat',
    });
  });
});
