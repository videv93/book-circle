import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateReadingStatus } from './updateReadingStatus';

// Mock dependencies
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
    userBook: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockHeaders = headers as unknown as ReturnType<typeof vi.fn>;
const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserBookFindUnique = prisma.userBook.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockUserBookUpdate = prisma.userBook.update as unknown as ReturnType<typeof vi.fn>;

describe('updateReadingStatus', () => {
  const baseUserBook = {
    id: 'ub-123',
    userId: 'user-123',
    bookId: 'book-123',
    status: 'CURRENTLY_READING',
    progress: 30,
    dateAdded: new Date('2026-01-01'),
    dateFinished: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'FINISHED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('You must be logged in to update status');
    }
  });

  it('returns error when userBookId does not belong to user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue({
      ...baseUserBook,
      userId: 'other-user',
    });

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'FINISHED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Book not found in your library');
    }
  });

  it('returns error when userBook does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(null);

    const result = await updateReadingStatus({
      userBookId: 'ub-nonexistent',
      status: 'FINISHED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Book not found in your library');
    }
  });

  it('returns existing record when status is unchanged', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(baseUserBook);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'CURRENTLY_READING',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(baseUserBook);
    }
    expect(mockUserBookUpdate).not.toHaveBeenCalled();
  });

  it('sets progress to 100 and dateFinished when changing to FINISHED', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(baseUserBook);

    const updatedRecord = {
      ...baseUserBook,
      status: 'FINISHED',
      progress: 100,
      dateFinished: new Date(),
    };
    mockUserBookUpdate.mockResolvedValue(updatedRecord);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'FINISHED',
    });

    expect(result.success).toBe(true);
    expect(mockUserBookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ub-123' },
        data: expect.objectContaining({
          status: 'FINISHED',
          progress: 100,
          dateFinished: expect.any(Date),
        }),
      })
    );
  });

  it('clears dateFinished but keeps progress when changing from FINISHED to CURRENTLY_READING', async () => {
    const finishedBook = {
      ...baseUserBook,
      status: 'FINISHED',
      progress: 100,
      dateFinished: new Date('2026-01-15'),
    };
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(finishedBook);

    const updatedRecord = {
      ...finishedBook,
      status: 'CURRENTLY_READING',
      dateFinished: null,
    };
    mockUserBookUpdate.mockResolvedValue(updatedRecord);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'CURRENTLY_READING',
    });

    expect(result.success).toBe(true);
    expect(mockUserBookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'CURRENTLY_READING',
          dateFinished: null,
        }),
      })
    );
    // Progress should NOT be in the update data (keeps existing value of 100)
    const updateCall = mockUserBookUpdate.mock.calls[0][0];
    expect(updateCall.data.progress).toBeUndefined();
  });

  it('resets progress to 0 and clears dateFinished when changing to WANT_TO_READ', async () => {
    const finishedBook = {
      ...baseUserBook,
      status: 'FINISHED',
      progress: 100,
      dateFinished: new Date('2026-01-15'),
    };
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(finishedBook);

    const updatedRecord = {
      ...finishedBook,
      status: 'WANT_TO_READ',
      progress: 0,
      dateFinished: null,
    };
    mockUserBookUpdate.mockResolvedValue(updatedRecord);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'WANT_TO_READ',
    });

    expect(result.success).toBe(true);
    expect(mockUserBookUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'WANT_TO_READ',
          progress: 0,
          dateFinished: null,
        }),
      })
    );
  });

  it('returns updated UserBook on success', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(baseUserBook);

    const updatedRecord = {
      ...baseUserBook,
      status: 'WANT_TO_READ',
      progress: 0,
      dateFinished: null,
    };
    mockUserBookUpdate.mockResolvedValue(updatedRecord);

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'WANT_TO_READ',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('WANT_TO_READ');
      expect(result.data.progress).toBe(0);
    }
  });

  it('returns validation error for invalid input', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });

    const result = await updateReadingStatus({
      userBookId: '',
      status: 'FINISHED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid input data');
    }
  });

  it('logs error and returns generic message on database failure', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetSession.mockResolvedValue({ user: { id: 'user-123' } });
    mockUserBookFindUnique.mockResolvedValue(baseUserBook);
    mockUserBookUpdate.mockRejectedValue(new Error('Database connection failed'));

    const result = await updateReadingStatus({
      userBookId: 'ub-123',
      status: 'FINISHED',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to update reading status');
    }
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to update reading status:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
