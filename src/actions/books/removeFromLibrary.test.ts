import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeFromLibrary } from './removeFromLibrary';

// Mock dependencies
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
    userBook: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockFindUnique = prisma.userBook.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockUpdate = prisma.userBook.update as unknown as ReturnType<typeof vi.fn>;

describe('removeFromLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await removeFromLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns error when userBookId is empty', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await removeFromLibrary({ userBookId: '' });

    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });

  it('returns error when userBook does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue(null);

    const result = await removeFromLibrary({ userBookId: 'ub-nonexistent' });

    expect(result).toEqual({
      success: false,
      error: 'Book not found in your library',
    });
  });

  it('returns error when userBook belongs to different user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-2',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: null,
    });

    const result = await removeFromLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({
      success: false,
      error: 'Book not found in your library',
    });
  });

  it('returns error when book is already soft-deleted', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: new Date('2026-01-01'),
    });

    const result = await removeFromLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({
      success: false,
      error: 'Book already removed from library',
    });
  });

  it('soft-deletes by setting deletedAt to current date', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-02-06T12:00:00Z');
    vi.setSystemTime(now);

    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: null,
    });

    const updatedRecord = {
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: now,
    };
    mockUpdate.mockResolvedValue(updatedRecord);

    const result = await removeFromLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({ success: true, data: updatedRecord });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'ub-123' },
      data: { deletedAt: now },
    });

    vi.useRealTimers();
  });

  it('returns updated UserBook on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'FINISHED',
      progress: 100,
      deletedAt: null,
    });

    const updatedRecord = {
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'FINISHED',
      progress: 100,
      deletedAt: expect.any(Date),
    };
    mockUpdate.mockResolvedValue(updatedRecord);

    const result = await removeFromLibrary({ userBookId: 'ub-123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('ub-123');
      expect(result.data.deletedAt).toBeTruthy();
    }
  });
});
