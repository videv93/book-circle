import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restoreToLibrary } from './restoreToLibrary';

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

describe('restoreToLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await restoreToLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns error when userBookId is empty', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await restoreToLibrary({ userBookId: '' });

    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });

  it('returns error when userBook does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue(null);

    const result = await restoreToLibrary({ userBookId: 'ub-nonexistent' });

    expect(result).toEqual({ success: false, error: 'Book not found' });
  });

  it('returns error when userBook belongs to different user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-2',
      bookId: 'book-1',
      deletedAt: new Date('2026-01-01'),
    });

    const result = await restoreToLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({ success: false, error: 'Book not found' });
  });

  it('returns error when book is NOT soft-deleted', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: null,
    });

    const result = await restoreToLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({
      success: false,
      error: 'Book is already in your library',
    });
  });

  it('restores by setting deletedAt to null', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: new Date('2026-01-01'),
    });

    const restoredRecord = {
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'CURRENTLY_READING',
      progress: 50,
      deletedAt: null,
    };
    mockUpdate.mockResolvedValue(restoredRecord);

    const result = await restoreToLibrary({ userBookId: 'ub-123' });

    expect(result).toEqual({ success: true, data: restoredRecord });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'ub-123' },
      data: { deletedAt: null },
    });
  });

  it('preserves all previous data on restore', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindUnique.mockResolvedValue({
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'FINISHED',
      progress: 100,
      dateFinished: new Date('2026-01-15'),
      deletedAt: new Date('2026-02-01'),
    });

    const restoredRecord = {
      id: 'ub-123',
      userId: 'user-1',
      bookId: 'book-1',
      status: 'FINISHED',
      progress: 100,
      dateFinished: new Date('2026-01-15'),
      deletedAt: null,
    };
    mockUpdate.mockResolvedValue(restoredRecord);

    const result = await restoreToLibrary({ userBookId: 'ub-123' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('FINISHED');
      expect(result.data.progress).toBe(100);
      expect(result.data.deletedAt).toBeNull();
    }
  });
});
