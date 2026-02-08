import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserProfile } from './getUserProfile';

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
      findUnique: vi.fn(),
    },
    follow: {
      findUnique: vi.fn(),
      count: vi.fn(),
    },
    userStreak: {
      findUnique: vi.fn(),
    },
    readingSession: {
      findMany: vi.fn(),
    },
    userBook: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUserFindUnique = prisma.user.findUnique as unknown as ReturnType<typeof vi.fn>;
const mockFollowFindUnique = (
  prisma as unknown as { follow: { findUnique: ReturnType<typeof vi.fn> } }
).follow.findUnique;
const mockFollowCount = (prisma as unknown as { follow: { count: ReturnType<typeof vi.fn> } })
  .follow.count;
const mockStreakFindUnique = (
  prisma as unknown as { userStreak: { findUnique: ReturnType<typeof vi.fn> } }
).userStreak.findUnique;
const mockSessionFindMany = (
  prisma as unknown as { readingSession: { findMany: ReturnType<typeof vi.fn> } }
).readingSession.findMany;
const mockUserBookFindMany = (
  prisma as unknown as { userBook: { findMany: ReturnType<typeof vi.fn> } }
).userBook.findMany;

const publicUser = {
  id: 'user-2',
  name: 'Jane Doe',
  image: null,
  bio: 'Avid reader',
  avatarUrl: 'https://example.com/avatar.jpg',
  showReadingActivity: true,
  userBooks: [
    {
      id: 'ub-1',
      book: { id: 'book-1', title: 'Great Book', author: 'Author A', coverUrl: null },
    },
  ],
};

const privateUser = {
  ...publicUser,
  showReadingActivity: false,
  userBooks: [],
};

const mockSessions = [
  {
    id: 'session-1',
    duration: 1800,
    startedAt: new Date('2026-02-06T10:00:00Z'),
    book: { id: 'book-1', title: 'Great Book', coverUrl: null },
  },
];

const mockFinishedBooks = [
  {
    id: 'ub-2',
    dateFinished: new Date('2026-01-20T00:00:00Z'),
    book: { id: 'book-2', title: 'Done Book', author: 'Author B', coverUrl: null },
  },
];

describe('getUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'user-1' } });
    mockFollowFindUnique.mockResolvedValue(null);
    mockFollowCount.mockResolvedValue(0);
    mockStreakFindUnique.mockResolvedValue({ currentStreak: 5, longestStreak: 10 });
    mockSessionFindMany.mockResolvedValue(mockSessions);
    mockUserBookFindMany.mockResolvedValue(mockFinishedBooks);
  });

  it('returns full profile with reading activity when public', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.name).toBe('Jane Doe');
      expect(result.data.user.showReadingActivity).toBe(true);
      expect(result.data.currentlyReading).toHaveLength(1);
      expect(result.data.recentSessions).toHaveLength(1);
      expect(result.data.finishedBooks).toHaveLength(1);
    }
  });

  it('returns limited profile when activity is private', async () => {
    mockUserFindUnique.mockResolvedValue(privateUser);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.name).toBe('Jane Doe');
      expect(result.data.user.showReadingActivity).toBe(false);
      expect(result.data.currentlyReading).toBeNull();
      expect(result.data.recentSessions).toBeNull();
      expect(result.data.finishedBooks).toBeNull();
    }
  });

  it('returns correct follower/following counts', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);
    mockFollowCount
      .mockResolvedValueOnce(15) // followerCount
      .mockResolvedValueOnce(8); // followingCount

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followerCount).toBe(15);
      expect(result.data.followingCount).toBe(8);
    }
  });

  it('returns correct streak data', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);
    mockStreakFindUnique.mockResolvedValue({ currentStreak: 7, longestStreak: 30 });

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentStreak).toBe(7);
      expect(result.data.longestStreak).toBe(30);
    }
  });

  it('returns error for non-existent user', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await getUserProfile({ userId: 'nonexistent' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('User not found');
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('includes recent sessions when activity is public', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recentSessions).not.toBeNull();
      expect(result.data.recentSessions![0].id).toBe('session-1');
      expect(result.data.recentSessions![0].duration).toBe(1800);
      expect(result.data.recentSessions![0].book.title).toBe('Great Book');
    }
  });

  it('includes finished books when activity is public', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.finishedBooks).not.toBeNull();
      expect(result.data.finishedBooks![0].book.title).toBe('Done Book');
      expect(result.data.finishedBooks![0].book.author).toBe('Author B');
    }
  });

  it('returns zero streaks when no streak record exists', async () => {
    mockUserFindUnique.mockResolvedValue(publicUser);
    mockStreakFindUnique.mockResolvedValue(null);

    const result = await getUserProfile({ userId: 'user-2' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentStreak).toBe(0);
      expect(result.data.longestStreak).toBe(0);
    }
  });
});
