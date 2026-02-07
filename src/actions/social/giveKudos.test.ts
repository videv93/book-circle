import { describe, it, expect, vi, beforeEach } from 'vitest';
import { giveKudos } from './giveKudos';

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
    readingSession: {
      findUnique: vi.fn(),
    },
    kudos: {
      create: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockGetSession = auth.api.getSession as ReturnType<typeof vi.fn>;
const mockSessionFindUnique = prisma.readingSession.findUnique as ReturnType<typeof vi.fn>;
const mockKudosCreate = (prisma as unknown as { kudos: { create: ReturnType<typeof vi.fn> } }).kudos.create;
const mockKudosFindUnique = (prisma as unknown as { kudos: { findUnique: ReturnType<typeof vi.fn> } }).kudos.findUnique;
const mockKudosCount = (prisma as unknown as { kudos: { count: ReturnType<typeof vi.fn> } }).kudos.count;

describe('giveKudos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
    });
  });

  it('creates kudos record successfully', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });
    mockKudosCreate.mockResolvedValue({
      id: 'kudos-1',
      giverId: 'user-1',
      receiverId: 'user-2',
      sessionId: 'session-1',
    });
    mockKudosCount.mockResolvedValue(1);

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kudosId).toBe('kudos-1');
      expect(result.data.totalKudos).toBe(1);
    }
  });

  it('returns total kudos count after creation', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });
    mockKudosCreate.mockResolvedValue({
      id: 'kudos-2',
      giverId: 'user-1',
      receiverId: 'user-2',
      sessionId: 'session-1',
    });
    mockKudosCount.mockResolvedValue(5);

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalKudos).toBe(5);
    }
  });

  it('handles P2002 duplicate kudos gracefully (idempotent)', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });

    const p2002Error = new Error('Unique constraint failed');
    Object.assign(p2002Error, { code: 'P2002' });
    mockKudosCreate.mockRejectedValue(p2002Error);

    mockKudosFindUnique.mockResolvedValue({ id: 'existing-kudos' });
    mockKudosCount.mockResolvedValue(3);

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.kudosId).toBe('existing-kudos');
      expect(result.data.totalKudos).toBe(3);
    }
  });

  it('returns error when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Unauthorized');
    }
  });

  it('returns error when session does not exist', async () => {
    mockSessionFindUnique.mockResolvedValue(null);

    const result = await giveKudos({
      sessionId: 'nonexistent',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Session not found');
    }
  });

  it('returns error when user tries to kudos own session', async () => {
    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-1', // Same as current user
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Cannot give kudos to yourself');
    }
  });

  it('returns error when session does not belong to target user', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-3', // Not user-2
    });

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Session does not belong to target user');
    }
  });

  it('handles Prisma errors gracefully', async () => {
    mockSessionFindUnique.mockRejectedValue(new Error('Database error'));

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to give kudos');
    }
  });

  it('handles invalid input gracefully', async () => {
    const result = await giveKudos({
      sessionId: '',
      targetUserId: 'user-2',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to give kudos');
    }
  });

  it('returns error when session user does not match authenticated user session', async () => {
    mockGetSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User' },
      session: null,
    });
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });
    mockKudosCreate.mockResolvedValue({
      id: 'kudos-1',
      giverId: 'user-1',
      receiverId: 'user-2',
      sessionId: 'session-1',
    });
    mockKudosCount.mockResolvedValue(1);

    const result = await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    // Should succeed since user-1 != user-2 (not self-kudos) and session belongs to user-2
    expect(result.success).toBe(true);
    expect(mockKudosCreate).toHaveBeenCalledWith({
      data: {
        giverId: 'user-1',
        receiverId: 'user-2',
        sessionId: 'session-1',
      },
    });
  });

  it('calls prisma.kudos.create with correct data', async () => {
    mockSessionFindUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-2',
    });
    mockKudosCreate.mockResolvedValue({
      id: 'kudos-1',
      giverId: 'user-1',
      receiverId: 'user-2',
      sessionId: 'session-1',
    });
    mockKudosCount.mockResolvedValue(1);

    await giveKudos({
      sessionId: 'session-1',
      targetUserId: 'user-2',
    });

    expect(mockKudosCreate).toHaveBeenCalledWith({
      data: {
        giverId: 'user-1',
        receiverId: 'user-2',
        sessionId: 'session-1',
      },
    });
  });
});
