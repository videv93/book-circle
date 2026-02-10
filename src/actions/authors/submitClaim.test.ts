import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing
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

const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: (tx: unknown) => unknown) =>
      fn({
        authorClaim: {
          findFirst: mockFindFirst,
          create: mockCreate,
        },
      })
    ),
  },
}));

import { submitClaim } from './submitClaim';
import { auth } from '@/lib/auth';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;

describe('submitClaim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'AMAZON',
      verificationUrl: 'https://amazon.com/author/test',
    });

    expect(result).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('returns error for invalid input', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });

    const result = await submitClaim({
      bookId: '',
      verificationMethod: 'INVALID',
    });

    expect(result).toEqual({ success: false, error: 'Invalid input' });
  });

  it('returns error when pending claim already exists', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindFirst.mockResolvedValueOnce({ id: 'claim-1', status: 'PENDING' });

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'AMAZON',
      verificationUrl: 'https://amazon.com/author/test',
    });

    expect(result).toEqual({
      success: false,
      error: 'You already have a pending claim for this book',
    });
  });

  it('returns error when approved claim already exists', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindFirst.mockResolvedValueOnce({ id: 'claim-1', status: 'APPROVED' });

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'WEBSITE',
      verificationUrl: 'https://example.com',
    });

    expect(result).toEqual({
      success: false,
      error: 'You are already verified as the author of this book',
    });
  });

  it('creates claim successfully with AMAZON method', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindFirst.mockResolvedValueOnce(null); // no active claim
    mockFindFirst.mockResolvedValueOnce(null); // no recent rejection
    const mockClaim = {
      id: 'claim-1',
      userId: 'user-1',
      bookId: 'book-1',
      verificationMethod: 'AMAZON',
      verificationUrl: 'https://amazon.com/author/test',
      status: 'PENDING',
    };
    mockCreate.mockResolvedValue(mockClaim);

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'AMAZON',
      verificationUrl: 'https://amazon.com/author/test',
    });

    expect(result).toEqual({ success: true, data: mockClaim });
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        bookId: 'book-1',
        verificationMethod: 'AMAZON',
        verificationUrl: 'https://amazon.com/author/test',
        verificationText: null,
      },
    });
  });

  it('creates claim with MANUAL method', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindFirst.mockResolvedValueOnce(null); // no active claim
    mockFindFirst.mockResolvedValueOnce(null); // no recent rejection
    const mockClaim = {
      id: 'claim-2',
      userId: 'user-1',
      bookId: 'book-1',
      verificationMethod: 'MANUAL',
      verificationText: 'I wrote this book and can prove it',
      status: 'PENDING',
    };
    mockCreate.mockResolvedValue(mockClaim);

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'MANUAL',
      verificationText: 'I wrote this book and can prove it',
    });

    expect(result).toEqual({ success: true, data: mockClaim });
  });

  it('blocks re-submission within 7-day cooldown period', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValueOnce(null); // no active claim
    mockFindFirst.mockResolvedValueOnce({
      id: 'old-claim',
      status: 'REJECTED',
      reviewedAt: twoDaysAgo,
    });

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'WEBSITE',
      verificationUrl: 'https://mysite.com',
    });

    expect(result.success).toBe(false);
    expect(result.success === false && result.error).toContain('You can resubmit');
  });

  it('allows re-submission after 7-day cooldown period', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    mockFindFirst.mockResolvedValueOnce(null); // no active claim
    mockFindFirst.mockResolvedValueOnce({
      id: 'old-claim',
      status: 'REJECTED',
      reviewedAt: eightDaysAgo,
    });
    const mockClaim = { id: 'new-claim', status: 'PENDING' };
    mockCreate.mockResolvedValue(mockClaim);

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'WEBSITE',
      verificationUrl: 'https://mysite.com',
    });

    expect(result).toEqual({ success: true, data: mockClaim });
  });

  it('allows re-submission when no recent rejection with reviewedAt', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFindFirst.mockResolvedValueOnce(null); // no active claim
    mockFindFirst.mockResolvedValueOnce(null); // query filters out claims with null reviewedAt
    const mockClaim = { id: 'new-claim', status: 'PENDING' };
    mockCreate.mockResolvedValue(mockClaim);

    const result = await submitClaim({
      bookId: 'book-1',
      verificationMethod: 'WEBSITE',
      verificationUrl: 'https://mysite.com',
    });

    expect(result).toEqual({ success: true, data: mockClaim });
  });
});
